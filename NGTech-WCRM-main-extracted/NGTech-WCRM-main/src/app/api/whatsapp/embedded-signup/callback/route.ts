import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/whatsapp/encryption'

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
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided from Meta.' }, { status: 400 })
    }

    if (!process.env.META_APP_SECRET || !process.env.NEXT_PUBLIC_META_APP_ID) {
       console.log('Embedded Signup attempted but META_APP_SECRET or NEXT_PUBLIC_META_APP_ID is not set in environment.')
       return NextResponse.json({ 
         error: 'Meta Developer credentials are not configured. Please contact the platform admin.' 
       }, { status: 501 })
    }

    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    // 1. Exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()
    
    if (tokenData.error) {
      console.error('Failed to exchange code:', tokenData.error)
      return NextResponse.json({ error: tokenData.error.message || 'Failed to exchange token with Meta.' }, { status: 400 })
    }
    
    const accessToken = tokenData.access_token
    if (!accessToken) {
      return NextResponse.json({ error: 'Meta did not return an access token.' }, { status: 400 })
    }

    // 2. Debug token to get WABA ID
    const debugUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
    const debugRes = await fetch(debugUrl)
    const debugData = await debugRes.json()

    if (debugData.error || !debugData.data) {
      console.error('Failed to debug token:', debugData.error)
      return NextResponse.json({ error: 'Failed to validate token with Meta.' }, { status: 400 })
    }

    const scopes = debugData.data.granular_scopes || []
    const wabaScope = scopes.find((s: any) => s.scope === 'whatsapp_business_management')
    const wabaId = wabaScope?.target_ids?.[0]

    if (!wabaId) {
      return NextResponse.json({ error: 'No WhatsApp Business Account found. Make sure you selected one during the flow.' }, { status: 400 })
    }

    // 3. Get Phone Numbers for the WABA
    const phonesUrl = `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers`
    const phonesRes = await fetch(phonesUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const phonesData = await phonesRes.json()

    if (phonesData.error || !phonesData.data || phonesData.data.length === 0) {
      console.error('Failed to fetch phone numbers:', phonesData.error)
      return NextResponse.json({ error: 'No phone numbers found for this WhatsApp Business Account.' }, { status: 400 })
    }

    const phoneNumbers = phonesData.data.map((p: any) => ({
      id: p.id,
      display_phone_number: p.display_phone_number,
      verified_name: p.verified_name,
      quality_rating: p.quality_rating,
    }))

    // 4. Save to whatsapp_signup_sessions so we don't leak token to frontend
    let encryptedToken = ''
    try {
      encryptedToken = encrypt(accessToken)
    } catch (err) {
      return NextResponse.json({ error: 'Failed to encrypt token. Check ENCRYPTION_KEY env.' }, { status: 500 })
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('whatsapp_signup_sessions')
      .insert({
        account_id: accountId,
        access_token_encrypted: encryptedToken,
        waba_id: wabaId,
        phone_numbers: phoneNumbers,
      })
      .select('id')
      .single()

    if (sessionError) {
      console.error('Failed to save signup session:', sessionError)
      return NextResponse.json({ error: 'Database error saving session.' }, { status: 500 })
    }

    // 5. Check if an active connection already exists for this account
    const { data: existingConfig } = await supabase
      .from('whatsapp_config')
      .select('id')
      .eq('account_id', accountId)
      .maybeSingle()

    return NextResponse.json({ 
      success: true, 
      session_id: sessionData.id,
      phone_numbers: phoneNumbers,
      has_existing: !!existingConfig
    })
  } catch (err: any) {
    console.error('[embedded-signup callback]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
