import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { engineSendText } from '@/lib/automations/meta-send'

// Lazy-initialized to bypass build-time env var check
let _adminClient: any = null
function getSupabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
  }
  return _adminClient
}

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

    const { conversation_id } = await request.json()
    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // 1. Fetch conversation details (contact and account)
    const { data: conv, error: convErr } = await admin
      .from('conversations')
      .select('account_id, contact_id, status, is_bot_paused')
      .eq('id', conversation_id)
      .single()

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 2. Fetch contact phone
    const { data: contact, error: contactErr } = await admin
      .from('contacts')
      .select('phone')
      .eq('id', conv.contact_id)
      .single()

    if (contactErr || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const csatMessage = "How would you rate our support today?\nReply with a number from 1 to 5 (5 being Excellent, 1 being Poor)."

    // 3. Send message via Meta API using engineSendText (registers it under 'bot')
    await engineSendText({
      accountId: conv.account_id,
      userId: user.id,
      contactId: conv.contact_id,
      conversationId: conversation_id,
      text: csatMessage,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[csat-api] failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
