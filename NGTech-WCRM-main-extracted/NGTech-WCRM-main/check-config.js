const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('whatsapp_config').select('phone_number_id, ai_auto_reply_enabled, ai_auto_reply_prompt');
  console.log('Configs:', data);
  if (error) console.error('Error:', error);
}

main();
