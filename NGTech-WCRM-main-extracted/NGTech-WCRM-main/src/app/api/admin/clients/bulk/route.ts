import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-supabase'


export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    
    // Verify platform admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from('profiles')
      .select('is_platform_admin')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { account_ids, action, plan } = body

    if (!Array.isArray(account_ids) || account_ids.length === 0) {
      return NextResponse.json({ error: 'account_ids must be a non-empty array' }, { status: 400 })
    }

    if (action === 'suspend') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('accounts')
        .update({ status: 'suspended' })
        .in('id', account_ids)
    } else if (action === 'activate') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('accounts')
        .update({ status: 'active' })
        .in('id', account_ids)
    } else if (action === 'change_plan') {
      if (!plan) {
        return NextResponse.json({ error: 'Missing plan' }, { status: 400 })
      }
      
      const { data: planMeta } = await (admin as any)
        .from('saas_pricing_plans')
        .select('max_contacts, max_messages_pm')
        .eq('slug', plan)
        .single()
        
      if (!planMeta) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('accounts')
        .update({
          plan,
          max_contacts: planMeta.max_contacts === -1 ? 9_999_999 : planMeta.max_contacts,
          max_messages_pm: planMeta.max_messages_pm === -1 ? 9_999_999 : planMeta.max_messages_pm,
        })
        .in('id', account_ids)
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be suspend, activate, or change_plan' }, { status: 400 })
    }

    return NextResponse.json({ success: true, updatedCount: account_ids.length })
  } catch (err: any) {
    console.error('[admin/clients/bulk PATCH]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
