import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uchpnskmbwwjdttlfdlz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaHBuc2ttYnd3amR0dGxmZGx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYxNDI0MiwiZXhwIjoyMDk4MTkwMjQyfQ.KLaTusAbW3bcx8USulNt3UHe1Z0n-1ZwZCBd0WHuce0'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function seed() {
  console.log('Starting seed process...')
  
  // 1. Get an account
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('*').limit(1)
  if (accErr || !accounts || !accounts.length) {
    console.error('No accounts found', accErr)
    return
  }
  const account = accounts[0]
  console.log('Found account:', account.id)
  
  // 2. Get the owner user_id
  const userId = account.owner_user_id

  // 3. Create a dummy contact
  const { data: contact, error: contactErr } = await supabase.from('contacts').insert({
    account_id: account.id,
    user_id: userId,
    phone: '1234567890',
    name: 'Test Customer',
  }).select().single()

  if (contactErr) {
    console.error('Failed to create contact', contactErr)
    return
  }
  console.log('Created contact:', contact.id)

  // 4. Create a conversation
  const { data: conv, error: convErr } = await supabase.from('conversations').insert({
    account_id: account.id,
    user_id: userId,
    contact_id: contact.id,
    status: 'open',
    unread_count: 0
  }).select().single()

  if (convErr) {
    console.error('Failed to create conversation', convErr)
    return
  }
  console.log('Created conversation:', conv.id)

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

  if (msgErr) {
    console.error('Failed to create messages', msgErr)
    return
  }
  
  console.log('Dummy conversation created successfully!')
}

seed()
