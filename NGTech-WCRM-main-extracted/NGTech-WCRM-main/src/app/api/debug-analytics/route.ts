import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AIAnalyticsService } from '@/lib/services/ai/analytics.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hardcode the user's account_id based on their login email 'sandeep@nighwantech.com'
    const account_id = 'ae12ea11-3a2f-4ff3-9cf7-40b0e5355445';

    // Get a conversation_id
    const { data: convos } = await supabase.from('conversations').select('id').eq('account_id', account_id).limit(1);
    const conversation_id = convos && convos.length > 0 ? convos[0].id : null;

    // Generate some mock events
    const mockEvents = [
      {
        account_id,
        conversation_id,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        response_time_ms: 1250,
        prompt_tokens: 350,
        completion_tokens: 80,
        total_tokens: 430,
        estimated_cost: 0.00008,
        is_handoff: false,
        is_error: false,
        language: 'english',
        intent_category: 'pricing'
      },
      {
        account_id,
        conversation_id,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        response_time_ms: 950,
        prompt_tokens: 210,
        completion_tokens: 45,
        total_tokens: 255,
        estimated_cost: 0.00004,
        is_handoff: false,
        is_error: false,
        language: 'english',
        intent_category: 'support'
      },
      {
        account_id,
        conversation_id,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        response_time_ms: 1500,
        prompt_tokens: 410,
        completion_tokens: 120,
        total_tokens: 530,
        estimated_cost: 0.0001,
        is_handoff: true,
        is_error: false,
        language: 'hindi',
        intent_category: 'complaint'
      },
      {
        account_id,
        conversation_id,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        response_time_ms: 2100,
        prompt_tokens: 500,
        completion_tokens: 150,
        total_tokens: 650,
        estimated_cost: 0.0003,
        is_handoff: false,
        is_error: false,
        language: 'english',
        intent_category: 'appointment'
      }
    ];

    for (const evt of mockEvents) {
      await AIAnalyticsService.logEvent(evt);
    }

    return NextResponse.json({ success: true, account_id, inserted: mockEvents.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
