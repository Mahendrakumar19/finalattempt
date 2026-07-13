const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('conversations').select('id, is_bot_paused').order('updated_at', { ascending: false }).limit(5);
  console.log('Conversations:', data);
  
  const { data: messages } = await supabase.from('messages').select('content_text, sender_type, created_at').order('created_at', { ascending: false }).limit(5);
  console.log('Messages:', messages);
}

main();
