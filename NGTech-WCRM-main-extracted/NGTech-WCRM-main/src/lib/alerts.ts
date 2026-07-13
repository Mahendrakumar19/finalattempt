import { getAdminClient } from '@/lib/admin-supabase'
import { currentMonthDate } from './usage-tracking'

export type AlertType = 'contact_80' | 'contact_100' | 'message_80' | 'message_100'

/**
 * Attempts to fire a usage alert for the given account.
 * It will insert a record into `account_alerts` to ensure the
 * alert is only fired exactly once per type per calendar month.
 */
export async function fireUsageAlert(accountId: string, alertType: AlertType) {
  try {
    const admin = getAdminClient()
    const month = currentMonthDate()

    // 1. Try to record the alert. The UNIQUE(account_id, alert_type, month)
    // constraint on the database ensures this only succeeds once.
    const { error: insertErr } = await (admin as any)
      .from('account_alerts')
      .insert({
        account_id: accountId,
        alert_type: alertType,
        month,
      })

    // If it violates the unique constraint, we already fired this alert this month.
    if (insertErr) {
      if (insertErr.code === '23505') return // Already alerted, silent exit
      throw insertErr
    }

    // 2. Fetch account owner email for the notification
    const { data: acc } = await (admin as any)
      .from('accounts')
      .select('owner_user_id')
      .eq('id', accountId)
      .maybeSingle()

    if (acc?.owner_user_id) {
      const { data: profile } = await (admin as any)
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', acc.owner_user_id)
        .maybeSingle()

      if (profile?.email) {
        await sendAlertEmail(profile.email, profile.full_name, alertType)
      }
    }
  } catch (err) {
    // Fire-and-forget, never bubble up to break the critical path
    console.error(`[alerts] Failed to fire alert ${alertType}:`, err)
  }
}

/**
 * Sends the actual email.
 * This is currently a placeholder. If you add Resend, SendGrid, or another
 * email provider, you will implement the API call here.
 */
async function sendAlertEmail(toEmail: string, name: string | null, alertType: AlertType) {
  let subject = ''
  let body = ''

  if (alertType === 'contact_80') {
    subject = 'Action Required: Approaching Contact Limit'
    body = `Hi ${name || 'there'},\n\nYou have reached 80% of your contact limit on your current plan. Please upgrade to avoid any disruption in adding new contacts.`
  } else if (alertType === 'contact_100') {
    subject = 'Action Required: Contact Limit Reached'
    body = `Hi ${name || 'there'},\n\nYou have reached 100% of your contact limit. New contacts cannot be added until you upgrade your plan.`
  } else if (alertType === 'message_80') {
    subject = 'Action Required: Approaching Monthly Message Limit'
    body = `Hi ${name || 'there'},\n\nYou have reached 80% of your monthly message limit. Please upgrade or purchase additional capacity.`
  } else if (alertType === 'message_100') {
    subject = 'Action Required: Monthly Message Limit Reached'
    body = `Hi ${name || 'there'},\n\nYou have reached 100% of your monthly message limit. Further outgoing messages will be blocked until your plan resets or is upgraded.`
  }

  // Placeholder for real email integration
  console.log('----------------------------------------------------')
  console.log(`[ALERT EMAIL DISPATCHED]`)
  console.log(`To: ${toEmail}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body: \n${body}`)
  console.log('----------------------------------------------------')
}
