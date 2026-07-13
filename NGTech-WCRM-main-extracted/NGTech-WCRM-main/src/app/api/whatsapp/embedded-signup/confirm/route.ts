import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt, encrypt } from '@/lib/whatsapp/encryption'
import { subscribeWabaToApp, registerPhoneNumber } from '@/lib/whatsapp/meta-api'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()
      
    const accountId = profile?.account_id
    if (!accountId) {
      return NextResponse.json({ error: 'Profile not linked to an account.' }, { status: 403 })
    }

    const body = await request.json()
    const { session_id, phone_number_id, confirm_replace } = body

    if (!session_id || !phone_number_id) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 })
    }

    // 1. Fetch Session
    const { data: session, error: sessionError } = await supabase
      .from('whatsapp_signup_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('account_id', accountId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or expired.' }, { status: 404 })
    }

    // 2. Validate Phone Number ID belongs to this session
    const isValidPhone = session.phone_numbers.some((p: any) => p.id === phone_number_id)
    if (!isValidPhone) {
      return NextResponse.json({ error: 'Invalid phone number selected.' }, { status: 400 })
    }

    // 3. Handle existing config if present
    const { data: existingConfig } = await supabase
      .from('whatsapp_config')
      .select('id')
      .eq('account_id', accountId)
      .maybeSingle()

    if (existingConfig) {
      if (!confirm_replace) {
        return NextResponse.json({ error: 'Confirmation required to replace existing connection.' }, { status: 400 })
      }
      
      // Archive the existing configuration
      const { error: archiveError } = await supabase
        .from('whatsapp_config')
        .update({
          archived_account_id: accountId,
          account_id: null,
          status: 'disconnected'
        })
        .eq('account_id', accountId)

      if (archiveError) {
        console.error('Failed to archive existing connection:', archiveError)
        return NextResponse.json({ error: 'Database error archiving previous connection.' }, { status: 500 })
      }
    }

    const accessToken = decrypt(session.access_token_encrypted)

    // 4. Subscribe WABA to App
    try {
      await subscribeWabaToApp({
        wabaId: session.waba_id,
        accessToken,
      })
    } catch (err: any) {
      console.warn('WABA subscribe failed (non-fatal):', err.message)
    }

    // Note: We skip /register here because Embedded Signup automatically registers the number if it's new. 
    // If it requires a PIN, it must be done via the standard Whatsapp Config UI where they can input a PIN.

    // 5. Save the New Config
    const { error: insertError } = await supabase
      .from('whatsapp_config')
      .insert({
        account_id: accountId,
        user_id: user.id,
        phone_number_id,
        waba_id: session.waba_id,
        access_token: session.access_token_encrypted,
        status: 'connected',
        connected_at: new Date().toISOString(),
        ai_auto_reply_enabled: false,
        sla_enabled: true,
      })

    if (insertError) {
      console.error('Failed to insert new connection:', insertError)
      return NextResponse.json({ error: 'Database error saving new connection.' }, { status: 500 })
    }

    // 6. Cleanup Session
    await supabase
      .from('whatsapp_signup_sessions')
      .delete()
      .eq('id', session_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[embedded-signup confirm]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
