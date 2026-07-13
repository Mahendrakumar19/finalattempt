const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Fetching admin account...');
  // Find Sandeep's profile to get the account ID
  const { data: adminProfiles, error: pErr } = await supabase
    .from('profiles')
    .select('account_id')
    .ilike('email', '%sandeep%')
    .limit(1);

  if (pErr || !adminProfiles || adminProfiles.length === 0) {
    console.error('Could not find admin profile:', pErr);
    return;
  }

  const accountId = adminProfiles[0].account_id;
  console.log('Using Account ID:', accountId);

  const agents = [
    { email: 'agent1@wacrm.local', password: 'password123', full_name: 'Alice Agent' },
    { email: 'agent2@wacrm.local', password: 'password123', full_name: 'Bob Agent' }
  ];

  for (const agent of agents) {
    console.log(`Creating user: ${agent.email}...`);
    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: agent.email,
      password: agent.password,
      email_confirm: true,
      user_metadata: { full_name: agent.full_name }
    });

    if (authErr) {
      console.error('Error creating user:', authErr);
      continue;
    }

    const userId = authData.user.id;

    // Wait a moment for the profile trigger to run
    await new Promise(r => setTimeout(r, 1000));

    console.log(`Setting account role for ${agent.email}...`);
    // Update profile
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        account_id: accountId,
        account_role: 'agent'
      })
      .eq('user_id', userId);

    if (updateErr) {
      console.error('Error updating profile:', updateErr);
    } else {
      console.log(`Successfully created agent ${agent.full_name}`);
    }
  }

  console.log('Done!');
}

main();
