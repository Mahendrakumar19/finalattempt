import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-supabase'

// ---------------------------------------------------------------
// Guard — confirm the caller is authenticated AND is_platform_admin
// ---------------------------------------------------------------
async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return null

  const admin = getAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('is_platform_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.is_platform_admin) return null
  return user
}

// ---------------------------------------------------------------
// GET /api/admin/clients
// Returns all accounts with owner email, current plan, status, usage.
// ---------------------------------------------------------------
export async function GET() {
  try {
    const caller = await requirePlatformAdmin()
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = getAdminClient()

    // Fetch all accounts (no embedded join — accounts.owner_user_id → auth.users,
    // not directly to profiles, so PostgREST can't resolve the relationship)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: accounts, error: accErr } = await (admin as any)
      .from('accounts')
      .select('id, name, plan, status, trial_ends_at, notes, max_contacts, max_messages_pm, created_at, owner_user_id')
      .order('created_at', { ascending: false })

    if (accErr) throw accErr

    // Fetch dynamic plans for MRR calculation
    const { data: pricingPlans } = await (admin as any)
      .from('saas_pricing_plans')
      .select('slug, monthly_price, discount_percent')
      
    const planPrices: Record<string, number> = {}
    for (const p of (pricingPlans ?? [])) {
      const discount = p.discount_percent ?? 0
      const price = p.monthly_price ?? 0
      planPrices[p.slug] = price * (1 - discount / 100)
    }

    // Fetch owner profiles separately: profiles.user_id = accounts.owner_user_id
    const ownerUserIds: string[] = (accounts ?? []).map((a: any) => a.owner_user_id).filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ownerProfiles } = ownerUserIds.length > 0
      ? await (admin as any)
          .from('profiles')
          .select('user_id, full_name, email, avatar_url, is_platform_admin, account_id')
          .in('user_id', ownerUserIds)
      : { data: [] }

    const ownerMap: Record<string, any> = {}
    for (const p of (ownerProfiles ?? []) as any[]) {
      ownerMap[p.user_id] = p
    }

    // Fetch contact counts per account (snapshot)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contactCounts } = await (admin as any)
      .from('contacts')
      .select('account_id')

    const contactCountMap: Record<string, number> = {}
    for (const row of (contactCounts ?? []) as any[]) {
      contactCountMap[row.account_id] = (contactCountMap[row.account_id] ?? 0) + 1
    }

    // Fetch this month's message usage
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usageRows } = await (admin as any)
      .from('account_usage')
      .select('account_id, messages_sent')
      .eq('month', monthStart)

    const usageMap: Record<string, number> = {}
    for (const row of (usageRows ?? []) as any[]) {
      usageMap[row.account_id] = row.messages_sent
    }

    // Fetch member counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberRows } = await (admin as any)
      .from('profiles')
      .select('account_id')

    const memberMap: Record<string, number> = {}
    for (const row of (memberRows ?? []) as any[]) {
      if (row.account_id) {
        memberMap[row.account_id] = (memberMap[row.account_id] ?? 0) + 1
      }
    }

    let totalMrr = 0
    let totalMessagesPlatform = 0

    const result = (accounts ?? []).map((acc: any) => {
      const owner = ownerMap[acc.owner_user_id]
      
      // Filter out "orphaned" personal accounts of users who have joined another team
      if (owner && owner.account_id && owner.account_id !== acc.id) {
        return null
      }

      const messagesThisMonth = usageMap[acc.id] ?? 0
      totalMessagesPlatform += messagesThisMonth
      
      // Only active paid plans count towards MRR
      if (acc.status === 'active' && acc.plan && acc.plan !== 'free') {
        totalMrr += (planPrices[acc.plan] ?? 0)
      }

      return {
        id: acc.id,
        name: acc.name,
        plan: acc.plan ?? 'free',
        status: acc.status ?? 'active',
        trial_ends_at: acc.trial_ends_at,
        notes: acc.notes,
        max_contacts: acc.max_contacts ?? 500,
        max_messages_pm: acc.max_messages_pm ?? 1000,
        created_at: acc.created_at,
        owner: {
          user_id: acc.owner_user_id,
          full_name: owner?.full_name ?? '',
          email: owner?.email ?? '',
          avatar_url: owner?.avatar_url ?? null,
          is_platform_admin: owner?.is_platform_admin ?? false,
        },
        usage: {
          contacts: contactCountMap[acc.id] ?? 0,
          messages_this_month: messagesThisMonth,
          members: memberMap[acc.id] ?? 0,
        },
      }
    }).filter((acc: any) => acc !== null)

    return NextResponse.json({ 
      accounts: result,
      stats: {
        mrr: Math.round(totalMrr),
        total_messages_this_month: totalMessagesPlatform
      }
    })
  } catch (err: any) {
    console.error('[admin/clients GET]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------
// POST /api/admin/clients
// Create a new client account (admin-side creation).
// Sends a signup email via Supabase Auth so the client can set
// their password; their account is pre-provisioned by the trigger.
// ---------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const caller = await requirePlatformAdmin()
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, plan = 'free', notes = '' } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'email and full_name are required' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Fetch plan details from DB
    const { data: planMeta } = await (admin as any)
      .from('saas_pricing_plans')
      .select('max_contacts, max_messages_pm')
      .eq('slug', plan)
      .single()

    if (!planMeta) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Invite user via Supabase Auth (sends a magic-link / invite email)
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name },
    })

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 400 })
    }

    const newUserId = inviteData.user.id

    // The signup trigger (handle_new_user) will auto-create the profile +
    // account. We now wait briefly and then patch the account to the chosen plan.
    // Use a small retry loop since the trigger is async.
    let accountId: string | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((r) => setTimeout(r, 600))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin as any)
        .from('profiles')
        .select('account_id')
        .eq('user_id', newUserId)
        .maybeSingle()
      if ((profile as any)?.account_id) {
        accountId = (profile as any).account_id
        break
      }
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account was not auto-created by the trigger. Please check DB logs.' },
        { status: 500 },
      )
    }

    // Update the account with the chosen plan + limits + notes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('accounts')
      .update({
        plan,
        max_contacts: planMeta.max_contacts === -1 ? 9_999_999 : planMeta.max_contacts,
        max_messages_pm: planMeta.max_messages_pm === -1 ? 9_999_999 : planMeta.max_messages_pm,
        notes,
      })
      .eq('id', accountId)

    return NextResponse.json({ success: true, account_id: accountId })
  } catch (err: any) {
    console.error('[admin/clients POST]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
