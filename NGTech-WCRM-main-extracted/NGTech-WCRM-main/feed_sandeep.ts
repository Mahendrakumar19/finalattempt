import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Find Sandeep Kumar
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .ilike('name', '%Sandeep Kumar%')
    .limit(1)
    .single();

  if (error || !contact) {
    console.error('Contact not found', error);
    return;
  }

  console.log('Found contact:', contact.id);

  // Find or create a conversation
  let { data: conv } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contact.id)
    .limit(1)
    .single();

  if (!conv) {
    console.log('No conversation found, creating one...');
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

  // Update conversation with rich AI data
  await supabase.from('conversations').update({
    ai_summary: fakeSummary,
    ai_lead_score: 'hot',
    ai_sentiment: 'positive',
    ai_confidence: 94,
    priority: 'high',
    updated_at: new Date().toISOString()
  }).eq('id', conv.id);

  console.log('Updated conversation with rich AI data');

  // Let's create some dummy deals to affect the lifecycle
  const { data: pipelines } = await supabase.from('pipelines').select('id').eq('account_id', contact.account_id).limit(1);
  if (pipelines && pipelines.length > 0) {
    const { data: stages } = await supabase.from('pipeline_stages').select('id, name').eq('pipeline_id', pipelines[0].id);
    if (stages && stages.length > 0) {
      const negotiationStage = stages.find(s => s.name.toLowerCase().includes('negotiat')) || stages[stages.length - 1];
      
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
      console.log('Created dummy deal');
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
    console.log('Added tag');
  }

  console.log('Done feeding data!');
}

main();
