import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/admin-supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/trials
 *
 * Scans for active accounts whose trial_ends_at timestamp has passed.
 * Automatically downgrades their status to 'suspended' and appends
 * an admin note.
 *
 * This endpoint should be called daily by Vercel Cron or a similar
 * external scheduler.
 */
export async function GET(request: Request) {
  // Simple auth to prevent random internet scans from hammering the DB
  // In a real Vercel environment you'd verify the CRON_SECRET headers.
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()
    const now = new Date().toISOString()

    // 1. Find all active accounts with expired trials
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: expiredAccounts, error: fetchErr } = await (admin as any)
      .from('accounts')
      .select('id, notes')
      .eq('status', 'active')
      .not('trial_ends_at', 'is', null)
      .lt('trial_ends_at', now)

    if (fetchErr) throw fetchErr

    if (!expiredAccounts || expiredAccounts.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    let successCount = 0

    // 2. Suspend each one and append a note
    for (const acc of expiredAccounts as any[]) {
      const noteAppend = `\n[${new Date().toISOString().split('T')[0]}] Auto-suspended due to trial expiration.`
      const newNotes = acc.notes ? `${acc.notes}${noteAppend}` : noteAppend.trim()

      const { error: updateErr } = await (admin as any)
        .from('accounts')
        .update({
          status: 'suspended',
          notes: newNotes,
        })
        .eq('id', acc.id)

      if (updateErr) {
        console.error(`[cron/trials] Failed to suspend account ${acc.id}:`, updateErr.message)
      } else {
        successCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: successCount,
      totalExpiredFound: expiredAccounts.length,
    })
  } catch (err: any) {
    console.error('[cron/trials]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
