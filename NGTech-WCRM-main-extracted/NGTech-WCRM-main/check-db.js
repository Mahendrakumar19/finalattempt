require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const contactId = 'b3573038-847e-4679-9e0b-0827b5c587af';
  
  const { data: contact } = await supabase.from('contacts').select('*').eq('id', contactId).single();
  console.log("Contact:", contact ? `${contact.name} (${contact.phone})` : "Not found");
  
  const { data: convs } = await supabase.from('conversations').select('id, contact_id, account_id').eq('contact_id', contactId);
  console.log("Conversations for this contact_id:", convs);
  
  // Find all conversations for Tanvi Gupta by phone or name
  const { data: tanviContacts } = await supabase.from('contacts').select('id, name, phone').ilike('name', '%Tanvi%');
  console.log("All Tanvi contacts:", tanviContacts);
  
  for (const tc of tanviContacts || []) {
    const { data: tcConvs } = await supabase.from('conversations').select('id, contact_id, account_id').eq('contact_id', tc.id);
    console.log(`Conversations for ${tc.id} (${tc.name}):`, tcConvs);
  }
}

check();
