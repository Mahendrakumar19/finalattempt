import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-supabase'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access (is part of the same account, or platform admin)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('account_id, account_role, is_platform_admin')
      .eq('user_id', user.id)
      .single()

    const { id: agentId } = await context.params
    
    // Get agent profile using admin client to bypass RLS for platform admins
    const admin = getAdminClient()
    const { data: agentProfile, error: profileErr } = await admin
      .from('profiles')
      .select('user_id, full_name, email, avatar_url, role, account_role, created_at, account_id')
      .eq('user_id', agentId)
      .single()

    if (profileErr || !agentProfile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Must be in the same account (or platform admin)
    if (!currentProfile?.is_platform_admin && currentProfile?.account_id !== agentProfile.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch assigned contacts
    const { data: contacts } = await admin
      .from('contacts')
      .select('id, name, email, phone, company, created_at')
      .eq('user_id', agentId)
      .order('created_at', { ascending: false })

    // Fetch all deals for this agent (not just won)
    const { data: deals } = await admin
      .from('deals')
      .select('id, contact_id, title, value, currency, status, expected_close_date, created_at')
      .eq('user_id', agentId)
      .order('created_at', { ascending: false })

    // Fetch meetings
    const { data: meetings } = await admin
      .from('meetings')
      .select('id, contact_id, title, scheduled_at, status, created_at')
      .eq('user_id', agentId)
      .order('created_at', { ascending: false })

    // Fetch quotes
    const { data: quotes } = await admin
      .from('quotes')
      .select('id, contact_id, description, amount, currency, status, created_at')
      .eq('user_id', agentId)
      .order('created_at', { ascending: false })

    // Fetch notes
    const { data: notes } = await admin
      .from('contact_notes')
      .select('id, contact_id, note_text, created_at')
      .eq('user_id', agentId)
      .order('created_at', { ascending: false })

    // Fetch tasks
    const { data: tasks } = await admin
      .from('tasks')
      .select('id, contact_id, title, description, due_date, status, created_at, updated_at')
      .or(`user_id.eq.${agentId},assigned_to.eq.${agentId}`)
      .order('created_at', { ascending: false })

    // Fetch suspension / leave records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: suspensions } = await (admin as any)
      .from('suspensions')
      .select('id, suspended_at, reason, notes')
      .eq('user_id', agentId)
      .order('suspended_at', { ascending: false })

    return NextResponse.json({
      profile: agentProfile,
      contacts: contacts || [],
      deals: deals || [],
      meetings: meetings || [],
      quotes: quotes || [],
      notes: notes || [],
      tasks: tasks || [],
      suspensions: suspensions || []
    })
  } catch (error: any) {
    console.error('[agent detail GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
