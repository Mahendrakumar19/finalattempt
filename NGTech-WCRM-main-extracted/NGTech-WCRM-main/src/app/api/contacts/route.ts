import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-supabase'
import { checkContactLimit } from '@/lib/plan-limits'
import { getContactCount } from '@/lib/usage-tracking'
import { fireUsageAlert } from '@/lib/alerts'

/**
 * POST /api/contacts
 *
 * Server-side contact creation with plan-limit enforcement.
 * Replaces the direct client-side supabase.from('contacts').insert()
 * in contact-form.tsx for NEW contacts (edits still go direct).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve account_id + plan limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const accountId = profile?.account_id as string | undefined
    if (!accountId) {
      return NextResponse.json({ error: 'Profile not linked to an account.' }, { status: 403 })
    }

    // Fetch account limits using service role (bypasses RLS — needed to read
    // plan columns that may not be in the anon-key typed schema yet)
    const admin = getAdminClient()
    const { data: account } = await (admin as any)
      .from('accounts')
      .select('status, max_contacts')
      .eq('id', accountId)
      .maybeSingle()

    // Hard-block suspended/cancelled accounts
    if (account?.status && account.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 },
      )
    }

    // Plan limit check
    const maxContacts: number = (account as any)?.max_contacts ?? 500
    const currentCount = await getContactCount(accountId)
    const limitCheck = checkContactLimit(currentCount, maxContacts)
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.message }, { status: 402 })
    }

    const body = await request.json()
    const { name, phone, email, company, tag_ids = [] } = body

    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
    }

    // Insert contact
    const { data: contact, error: insertErr } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        account_id: accountId,
        name: name?.trim() || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        company: company?.trim() || null,
      })
      .select('id')
      .single()

    if (insertErr) {
      // Unique violation (duplicate phone)
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'A contact with this phone number already exists.', code: 'DUPLICATE_PHONE' },
          { status: 409 },
        )
      }
      throw insertErr
    }

    // Sync tags if provided
    if (tag_ids.length > 0) {
      await supabase
        .from('contact_tags')
        .insert(tag_ids.map((tag_id: string) => ({ contact_id: contact.id, tag_id })))
    }

    // Check thresholds to trigger alert emails
    if (maxContacts > 0) {
      const newCount = currentCount + 1
      const pct = newCount / maxContacts
      if (pct >= 1.0) {
        void fireUsageAlert(accountId, 'contact_100')
      } else if (pct >= 0.8) {
        void fireUsageAlert(accountId, 'contact_80')
      }
    }

    return NextResponse.json({ success: true, id: contact.id })
  } catch (err: any) {
    console.error('[api/contacts POST]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
