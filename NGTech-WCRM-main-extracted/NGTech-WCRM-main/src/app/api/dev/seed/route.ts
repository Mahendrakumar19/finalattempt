import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })

    // 1. Get an account
    const { data: accounts, error: accErr } = await supabase.from('accounts').select('*').limit(1)
    if (accErr || !accounts || !accounts.length) {
      return NextResponse.json({ error: 'No accounts found' }, { status: 500 })
    }
    const account = accounts[0]
    
    const userId = account.owner_user_id

    // 3. Create a dummy contact
    const { data: contact, error: contactErr } = await supabase.from('contacts').insert({
      account_id: account.id,
      user_id: userId,
      phone: '1234567890',
      name: 'Test Customer',
    }).select().single()

    if (contactErr) {
      // If contact exists, let's just use it
      console.log('Contact error', contactErr)
    }

    // fallback contact selection if insert failed (due to unique constraints)
    let finalContactId = contact?.id
    if (!finalContactId) {
      const { data: existingContact } = await supabase.from('contacts').select('id').eq('account_id', account.id).limit(1).single()
      finalContactId = existingContact?.id
    }

    if (!finalContactId) {
       return NextResponse.json({ error: 'Could not create or find a contact' }, { status: 500 })
    }

    // 4. Create a conversation
    const { data: conv, error: convErr } = await supabase.from('conversations').insert({
      account_id: account.id,
      user_id: userId,
      contact_id: finalContactId,
      status: 'open',
      unread_count: 0
    }).select().single()

    if (convErr) throw convErr

    // 5. Create some messages
    const { error: msgErr } = await supabase.from('messages').insert([
      {
        conversation_id: conv.id,
        sender_type: 'customer',
        content_type: 'text',
        content_text: 'Hi, I need help with my recent order.',
        status: 'delivered'
      },
      {
        conversation_id: conv.id,
        sender_type: 'agent',
        content_type: 'text',
        content_text: 'Hello! I can help with that. Could you please provide your order number?',
        status: 'delivered'
      },
      {
        conversation_id: conv.id,
        sender_type: 'customer',
        content_type: 'text',
        content_text: 'Yes, it is #ORD-99214.',
        status: 'delivered'
      }
    ])

    if (msgErr) throw msgErr
    
    return NextResponse.json({ success: true, message: 'Dummy conversation created successfully!' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
