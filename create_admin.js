const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) throw new Error('Missing env vars');

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim(), {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const email = 'admin@finance.hq';
  const password = 'AdminPassword123!';
  
  console.log('Creating admin user...');
  let { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  let uid = data?.user?.id;
  
  if (error) {
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
       console.log('User already exists, finding id...');
       const users = await supabase.auth.admin.listUsers();
       const u = users.data.users.find(u => u.email === email);
       if (u) {
         uid = u.id;
       } else {
         console.error('User exists but not found in list');
         return;
       }
    } else {
      console.error('Error creating user:', error);
      return;
    }
  }
  
  // wait a bit for the handle_new_user trigger to create the profile row
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Setting role to admin...');
  const { error: profileError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', uid);
  
  if (profileError) {
    console.error('Error updating role:', profileError);
  } else {
    console.log('Done! User:', email, 'Password:', password);
  }
}
run();
