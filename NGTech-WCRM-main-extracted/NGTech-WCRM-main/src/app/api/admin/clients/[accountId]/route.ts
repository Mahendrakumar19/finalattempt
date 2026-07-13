import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-supabase'
import { type AccountStatus } from '@/lib/plan-limits'

async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = getAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('is_platform_admin')
    .eq('user_id', user.id)
    .maybeSingle()
  return profile?.is_platform_admin ? user : null
}

// ---------------------------------------------------------------
// GET /api/admin/clients/[accountId]
// Full detail for one account.
// ---------------------------------------------------------------
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const caller = await requirePlatformAdmin()
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { accountId } = await params
    const admin = getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: acc, error: accErr } = await (admin as any)
      .from('accounts')
      .select('id, name, plan, status, trial_ends_at, notes, max_contacts, max_messages_pm, created_at, owner_user_id')
      .eq('id', accountId)
      .single()

    if (accErr || !acc) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Fetch owner profile separately (accounts.owner_user_id → profiles.user_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ownerProfile } = await (admin as any)
      .from('profiles')
      .select('user_id, full_name, email, avatar_url, is_platform_admin')
      .eq('user_id', (acc as any).owner_user_id)
      .maybeSingle()

    // Team members
    const { data: members } = await admin
      .from('profiles')
      .select('id, full_name, email, account_role, avatar_url, created_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })

    // Contact count
    const { count: contactCount } = await admin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)

    // Conversation count
    const { count: convCount } = await admin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)

    // Monthly usage (last 3 months)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usageRows } = await (admin as any)
      .from('account_usage')
      .select('month, messages_sent, contacts_count')
      .eq('account_id', accountId)
      .order('month', { ascending: false })
      .limit(3)

    const owner = ownerProfile as any

    return NextResponse.json({
      account: {
        id: acc.id,
        name: acc.name,
        plan: acc.plan,
        status: acc.status,
        trial_ends_at: acc.trial_ends_at,
        notes: acc.notes,
        max_contacts: acc.max_contacts,
        max_messages_pm: acc.max_messages_pm,
        created_at: acc.created_at,
        owner: {
          user_id: acc.owner_user_id,
          full_name: owner?.full_name ?? '',
          email: owner?.email ?? '',
          avatar_url: owner?.avatar_url ?? null,
          is_platform_admin: owner?.is_platform_admin ?? false,
        },
        stats: {
          contacts: contactCount ?? 0,
          conversations: convCount ?? 0,
          members: members?.length ?? 0,
        },
        usage_history: usageRows ?? [],
        members: members ?? [],
      },
    })
  } catch (err: any) {
    console.error('[admin/clients/[accountId] GET]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ---------------------------------------------------------------
// PATCH /api/admin/clients/[accountId]
// Update plan, status, limits, or notes.
// ---------------------------------------------------------------
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const caller = await requirePlatformAdmin()
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { accountId } = await params
    const body = await request.json()

    const allowed = ['plan', 'status', 'notes', 'trial_ends_at', 'max_contacts', 'max_messages_pm']
    const update: Record<string, unknown> = {}

    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }

    // When changing plan, auto-update limits to plan defaults (unless overridden)
    const admin = getAdminClient()
    if (update.plan && typeof update.plan === 'string') {
      const plan = update.plan as string
      
      const { data: planMeta } = await (admin as any)
        .from('saas_pricing_plans')
        .select('max_contacts, max_messages_pm')
        .eq('slug', plan)
        .single()
        
      if (!planMeta) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }
      
      if (!('max_contacts' in body)) {
        update.max_contacts = planMeta.max_contacts === -1 ? 9_999_999 : planMeta.max_contacts
      }
      if (!('max_messages_pm' in body)) {
        update.max_messages_pm = planMeta.max_messages_pm === -1 ? 9_999_999 : planMeta.max_messages_pm
      }
    }

    if (update.status) {
      const validStatuses: AccountStatus[] = ['active', 'suspended', 'cancelled']
      if (!validStatuses.includes(update.status as AccountStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from('accounts')
      .update(update as any)
      .eq('id', accountId)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/clients/[accountId] PATCH]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ---------------------------------------------------------------
// DELETE /api/admin/clients/[accountId]
// Soft-delete: sets status = 'cancelled'. Hard delete not exposed.
// ---------------------------------------------------------------
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const caller = await requirePlatformAdmin()
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { accountId } = await params
    const admin = getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('accounts')
      .update({ status: 'cancelled' } as any)
      .eq('id', accountId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/clients/[accountId] DELETE]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
