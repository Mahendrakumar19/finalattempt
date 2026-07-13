import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const contactId = 'b3573038-847e-4679-9e0b-0827b5c587af'; // Tanvi Gupta
  const results: Record<string, any> = {};

  // Test 1: Basic query - just id and status
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, status, updated_at')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();
    results.test1_basic = { data, error };
  } catch (e: any) {
    results.test1_basic = { crash: e.message };
  }

  // Test 2: Add ai_sentiment, ai_lead_score, ai_summary
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, ai_sentiment, ai_lead_score, ai_summary')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();
    results.test2_ai_cols = { data, error };
  } catch (e: any) {
    results.test2_ai_cols = { crash: e.message };
  }

  // Test 3: Add priority
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, priority')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();
    results.test3_priority = { data, error };
  } catch (e: any) {
    results.test3_priority = { crash: e.message };
  }

  // Test 4: Add ai_confidence
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, ai_confidence')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();
    results.test4_confidence = { data, error };
  } catch (e: any) {
    results.test4_confidence = { crash: e.message };
  }

  return NextResponse.json(results);
}
