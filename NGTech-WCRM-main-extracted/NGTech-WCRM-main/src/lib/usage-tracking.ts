/**
 * incrementMessageUsage — fire-and-forget helper.
 *
 * Upserts one row in account_usage for the current month and increments
 * messages_sent by 1. Uses the service-role client so it bypasses RLS
 * and works from both agent-send and automation/bot-send paths.
 *
 * Errors are logged but never thrown — a usage-tracking failure must
 * never block an actual message from being delivered.
 */

import { getAdminClient } from '@/lib/admin-supabase'
import { fireUsageAlert } from './alerts'

export function currentMonthDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export async function incrementMessageUsage(accountId: string): Promise<void> {
  try {
    const admin = getAdminClient()
    const month = currentMonthDate()

    // Upsert: insert the row if it doesn't exist, then increment.
    // Two-step because Supabase JS doesn't support UPDATE on conflict
    // with arithmetic expressions in a single call.
    const { data: existing } = await (admin as any)
      .from('account_usage')
      .select('id, messages_sent')
      .eq('account_id', accountId)
      .eq('month', month)
      .maybeSingle()

    let newSentCount = 1

    if (existing) {
      newSentCount = existing.messages_sent + 1
      await (admin as any)
        .from('account_usage')
        .update({
          messages_sent: newSentCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await (admin as any)
        .from('account_usage')
        .insert({
          account_id: accountId,
          month,
          messages_sent: 1,
          contacts_count: 0,
        })
    }

    // Threshold checking
    const { data: acc } = await (admin as any)
      .from('accounts')
      .select('max_messages_pm')
      .eq('id', accountId)
      .maybeSingle()

    const max = acc?.max_messages_pm ?? 1000
    if (max > 0) { // -1 means unlimited
      const pct = newSentCount / max
      if (pct >= 1.0) {
        void fireUsageAlert(accountId, 'message_100')
      } else if (pct >= 0.8) {
        void fireUsageAlert(accountId, 'message_80')
      }
    }
  } catch (err) {
    // Best-effort — never block the message send
    console.error('[usage] incrementMessageUsage failed:', err instanceof Error ? err.message : err)
  }
}

/**
 * getMessageUsageThisMonth — returns how many messages were sent
 * this month for an account. Returns 0 on any error.
 */
export async function getMessageUsageThisMonth(accountId: string): Promise<number> {
  try {
    const admin = getAdminClient()
    const month = currentMonthDate()
    const { data } = await (admin as any)
      .from('account_usage')
      .select('messages_sent')
      .eq('account_id', accountId)
      .eq('month', month)
      .maybeSingle()
    return (data as any)?.messages_sent ?? 0
  } catch {
    return 0
  }
}

/**
 * getContactCount — returns the current contact count for an account.
 * Returns 0 on any error.
 */
export async function getContactCount(accountId: string): Promise<number> {
  try {
    const admin = getAdminClient()
    const { count } = await admin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
    return count ?? 0
  } catch {
    return 0
  }
}
