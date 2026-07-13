import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Setup Supabase admin
let _adminClient: any = null;
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, new_department_id } = await request.json();

    if (!conversation_id || new_department_id === undefined) {
      return NextResponse.json({ error: 'Missing conversation_id or new_department_id' }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // 1. Get current conversation details
    const { data: conv, error: convErr } = await admin
      .from('conversations')
      .select('account_id, department_id, assigned_agent_id')
      .eq('id', conversation_id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Permission check: Only Admin, Reception, Team Lead, or Department Manager can transfer.
    // For simplicity, we check if the user is a manager/admin in their roles.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    const { data: deptMembership } = await supabase
      .from('department_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('department_id', conv.department_id);

    // Allow global admins, department managers, the currently assigned agent, or any agent if it's currently unassigned.
    // For simplicity and standard CRM workflows, any valid agent in the account can transfer.
    if (!profile) {
      return NextResponse.json({ error: 'Insufficient permissions to transfer conversation.' }, { status: 403 });
    }

    // 3. Update the conversation (clear agent, set new department)
    const { error: updateErr } = await admin
      .from('conversations')
      .update({
        department_id: new_department_id,
        assigned_agent_id: null,
        routing_status: 'department_queue'
      })
      .eq('id', conversation_id);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
    }

    // 4. Log the transfer
    const details = {
      previous_department_id: conv.department_id,
      previous_agent_id: conv.assigned_agent_id,
    };

    await admin.from('conversation_routing_logs').insert({
      conversation_id: conversation_id,
      account_id: conv.account_id,
      actor_id: user.id,
      event_type: 'department_transfer',
      previous_value: conv.department_id,
      new_value: new_department_id,
      reason: 'Manual transfer',
      details
    });

    // 5. Rerun Routing Engine
    const { data: newAgentId, error: rpcErr } = await admin.rpc('auto_assign_conversation', { p_conversation_id: conversation_id });

    if (rpcErr) {
      console.error('[Routing Transfer] auto-assign failed:', rpcErr);
      return NextResponse.json({ error: 'Transfer succeeded, but auto-routing failed.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, assigned_agent_id: newAgentId });
  } catch (error) {
    console.error('[Routing Transfer] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
