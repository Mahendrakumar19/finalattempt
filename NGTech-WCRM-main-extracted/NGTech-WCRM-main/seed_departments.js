const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const departmentsToSeed = [
  "Sales",
  "Technical Consultant",
  "Customer Support",
  "Accounts",
  "Management"
];

async function seed() {
  try {
    // Get the primary account
    const { data: accounts, error: accountErr } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);

    if (accountErr) throw accountErr;
    if (!accounts || accounts.length === 0) {
      console.log('No accounts found in the database. Cannot seed departments.');
      return;
    }

    const accountId = accounts[0].id;
    console.log('Using Account ID:', accountId);

    for (const deptName of departmentsToSeed) {
      const { data, error } = await supabase
        .from('departments')
        .insert({ account_id: accountId, name: deptName })
        .select()
        .single();
        
      if (error) {
        console.error(`Failed to insert ${deptName}:`, error.message);
      } else {
        console.log(`Inserted: ${data.name}`);
      }
    }
    
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

seed();
