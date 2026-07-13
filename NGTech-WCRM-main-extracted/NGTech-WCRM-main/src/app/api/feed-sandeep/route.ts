import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const targetId = '63c8c233-4055-44b1-8329-0e3770716376';
  
  // Find Sandeep Kumar
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', targetId)
    .limit(1)
    .single();

  if (error || !contact) {
    return NextResponse.json({ error: 'Contact not found', details: error || 'No contact returned', targetId });
  }

  // Find or create a conversation
  let { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contact.id)
    .limit(1)
    .single();

  if (!conv) {
    const { data: newConv } = await supabase.from('conversations').insert({
      contact_id: contact.id,
      user_id: contact.user_id,
      account_id: contact.account_id,
      status: 'open'
    }).select().single();
    conv = newConv;
  }

  // Generate robust AI Summary JSON
  const fakeSummary = JSON.stringify({
    summary: "Sandeep reached out looking for a complete CRM implementation for their 50-person sales team. They need WhatsApp integration, AI auto-responders, and multi-agent routing. They are currently evaluating competitors but prefer our UI.",
    points: [
      "Needs CRM for 50 agents",
      "Requires WhatsApp API integration",
      "Budget: $5000/mo",
      "Timeline: Q3 Implementation"
    ],
    last_objection: "Concerned about data migration time from HubSpot",
    action: "Schedule a technical deep-dive call with the engineering team"
  });

  // Update ALL conversations for this contact with rich AI data
  await supabase.from('conversations').update({
    ai_summary: fakeSummary,
    ai_lead_score: 'hot',
    ai_sentiment: 'positive',
    ai_confidence: 98,
    priority: 'high',
    updated_at: new Date().toISOString()
  }).eq('contact_id', contact.id);

  // Let's create some dummy deals to affect the lifecycle
  const { data: pipelines } = await supabase.from('pipelines').select('id').eq('account_id', contact.account_id).limit(1);
  if (pipelines && pipelines.length > 0) {
    const { data: stages } = await supabase.from('pipeline_stages').select('id, name').eq('pipeline_id', pipelines[0].id);
    if (stages && stages.length > 0) {
      const negotiationStage = stages.find((s: any) => s.name.toLowerCase().includes('negotiat')) || stages[stages.length - 1];
      
      await supabase.from('deals').insert({
        user_id: contact.user_id,
        account_id: contact.account_id,
        contact_id: contact.id,
        pipeline_id: pipelines[0].id,
        stage_id: negotiationStage.id,
        title: 'Enterprise CRM Implementation',
        value: 60000,
        status: 'open'
      });
    }
  }

  // Tags
  let { data: tag } = await supabase.from('tags').select('*').eq('account_id', contact.account_id).ilike('name', 'Enterprise Lead').maybeSingle();
  
  if (!tag) {
    const { data: newTag } = await supabase.from('tags').insert({
      name: 'Enterprise Lead',
      account_id: contact.account_id,
      user_id: contact.user_id,
      color: '#3b82f6'
    }).select().single();
    tag = newTag;
  }
  
  if (tag) {
    await supabase.from('contact_tags').upsert({
      contact_id: contact.id,
      tag_id: tag.id
    }, { onConflict: 'contact_id,tag_id' });
  }

  return NextResponse.json({ success: true, message: 'Data fed successfully via service role for ' + contact.id });
}
