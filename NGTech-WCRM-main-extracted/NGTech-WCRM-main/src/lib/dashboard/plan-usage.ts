import type { SupabaseClient } from '@supabase/supabase-js'

export interface PlanUsageSummaryData {
  planName: string
  status: string
  maxContacts: number
  currentContacts: number
  maxMessages: number
  currentMessages: number
  unpaidInvoicesCount: number
  unpaidInvoicesTotal: number
}

export async function loadPlanUsageSummary(
  db: SupabaseClient,
  accountId: string
): Promise<PlanUsageSummaryData | null> {
  if (!accountId) return null

  try {
    // 1. Fetch account limits
    const { data: account, error: accErr } = await db
      .from('accounts')
      .select('plan, status, max_contacts, max_messages_pm')
      .eq('id', accountId)
      .maybeSingle()

    if (accErr || !account) throw accErr || new Error('Account not found')

    // 2. Fetch contact count
    const { count: currentContacts } = await db
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)

    // 3. Fetch message usage this month
    const d = new Date()
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    
    const { data: usage } = await db
      .from('account_usage')
      .select('messages_sent')
      .eq('account_id', accountId)
      .eq('month', monthStr)
      .maybeSingle()

    const currentMessages = usage?.messages_sent || 0

    // 4. Fetch unpaid invoices
    const { data: invoices } = await db
      .from('invoices')
      .select('amount')
      .eq('account_id', accountId)
      .in('status', ['unpaid', 'overdue'])

    const unpaidCount = invoices?.length || 0
    const unpaidTotal = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0

    return {
      planName: account.plan || 'Free',
      status: account.status || 'active',
      maxContacts: account.max_contacts ?? 500,
      currentContacts: currentContacts || 0,
      maxMessages: account.max_messages_pm ?? 1000,
      currentMessages: currentMessages,
      unpaidInvoicesCount: unpaidCount,
      unpaidInvoicesTotal: unpaidTotal,
    }
  } catch (err) {
    console.error('[plan-usage] failed to load:', err)
    return null
  }
}
