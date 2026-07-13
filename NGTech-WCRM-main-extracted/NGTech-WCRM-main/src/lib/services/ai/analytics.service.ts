import { createClient } from '@supabase/supabase-js';
import type { AIAnalyticsEvent } from '@/types';

export class AIAnalyticsService {
  /**
   * Logs an AI interaction to the database for analytics reporting.
   */
  static async logEvent(event: Omit<AIAnalyticsEvent, 'id' | 'created_at'> & { language?: string, intent_category?: string }) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await supabase
        .from('ai_analytics_events')
        .insert({
          account_id: event.account_id,
          conversation_id: event.conversation_id,
          provider: event.provider,
          model: event.model,
          response_time_ms: event.response_time_ms,
          prompt_tokens: event.prompt_tokens,
          completion_tokens: event.completion_tokens,
          total_tokens: event.total_tokens,
          estimated_cost: event.estimated_cost,
          is_handoff: event.is_handoff,
          is_error: event.is_error,
          error_message: event.error_message,
          language: event.language,
          intent_category: event.intent_category
        });

      if (error) {
        console.error('[AIAnalyticsService] Failed to log event:', error);
      }
    } catch (err) {
      console.error('[AIAnalyticsService] Exception logging event:', err);
    }
  }

  /**
   * Calculate a rough estimate of cost based on provider/model and tokens.
   */
  static estimateCost(provider: string, model: string, promptTokens: number, completionTokens: number): number {
    let costPer1kPrompt = 0;
    let costPer1kCompletion = 0;

    if (provider === 'gemini') {
      if (model.includes('flash')) {
        costPer1kPrompt = 0.00035;
        costPer1kCompletion = 0.00105;
      } else {
        costPer1kPrompt = 0.0035;
        costPer1kCompletion = 0.0105;
      }
    } else if (provider === 'groq') {
      if (model.includes('70b')) {
        costPer1kPrompt = 0.00059;
        costPer1kCompletion = 0.00079;
      } else if (model.includes('8b')) {
        costPer1kPrompt = 0.00005;
        costPer1kCompletion = 0.00008;
      } else {
        costPer1kPrompt = 0.00024;
        costPer1kCompletion = 0.00024;
      }
    }

    return (promptTokens / 1000) * costPer1kPrompt + (completionTokens / 1000) * costPer1kCompletion;
  }
}
