import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers(); // We don't have service role key easily... wait, we can just login with user's token or just check the users table via an anon call? No, RLS is on.
}
check();
