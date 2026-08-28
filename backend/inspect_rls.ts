
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for inspection

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRLS() {
  console.log('--- RLS POLICIES INSPECTION ---');
  
  const tables = ['zoal_blog_posts', 'zoal_blog_categories', 'zoal_blog_views', 'zoal_blog_schedules'];
  
  for (const table of tables) {
    const { data, error } = await supabase.rpc('inspect_rls_policies', { table_name: table });
    if (error) {
       // Fallback: try querying pg_policies
       const { data: policies, error: polError } = await supabase.from('pg_policies').select('*').eq('tablename', table);
       if (polError) {
         console.error(`Error fetching policies for ${table}:`, polError.message);
       } else {
         console.log(`Policies for ${table}:`, policies);
       }
    } else {
      console.log(`Policies for ${table}:`, data);
    }
  }
}

inspectRLS();
