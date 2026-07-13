import { SupabaseClient } from "@supabase/supabase-js";

export type ActivityCategory = 
  | 'system' 
  | 'sales' 
  | 'communication' 
  | 'support' 
  | 'meetings' 
  | 'tasks' 
  | 'orders' 
  | 'ai';

export interface LogActivityParams {
  accountId: string;
  contactId: string;
  actorId?: string | null;
  category: ActivityCategory;
  activityType: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  isMilestone?: boolean;
}

/**
 * Centralized Activity Logger Service
 * 
 * Use this service to log customer interactions, AI decisions, system events,
 * and standard CRM actions into the unified `customer_activities` ledger.
 * This powers the Customer 360 Timeline.
 */
export class ActivityLogger {
  static async log(supabase: SupabaseClient, params: LogActivityParams) {
    const { error, data } = await supabase.rpc('log_customer_activity', {
      p_account_id: params.accountId,
      p_contact_id: params.contactId,
      p_actor_id: params.actorId || null,
      p_category: params.category,
      p_activity_type: params.activityType,
      p_title: params.title,
      p_description: params.description,
      p_metadata: params.metadata || {},
      p_is_milestone: params.isMilestone || false,
    });

    if (error) {
      console.error('Failed to log customer activity:', error);
      // We don't throw here to prevent non-critical logging failures from breaking core flows
      return null;
    }
    
    return data; // Returns the UUID of the inserted row
  }
}
