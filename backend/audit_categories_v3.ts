
import { createClient } from '@supabase/supabase-js';

// Using hardcoded credentials from src/lib/supabaseClient.ts as fallback
const supabaseUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseKey = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3'; // This is ANON key, we might need SERVICE ROLE for full audit if RLS is strict, but let's try.

// If you have a service role key in env, use it. 
// But in this environment, we likely don't have it unless it's in .env (which we saw is only .env.example)

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('--- FORENSIC AUDIT V3 (Using Public Key) ---');

  const { data: categories, error: catErr } = await supabase
    .from('zoal_blog_categories')
    .select('*');

  if (catErr) {
    console.error('Error fetching categories:', catErr);
    if (catErr.code === 'PGRST204') {
        console.log('Verification: Table zoal_blog_categories DOES NOT EXIST.');
    }
  } else {
    console.log(`Total Categories found: ${categories?.length || 0}`);
    if (categories && categories.length > 0) {
      console.log('Columns found:', Object.keys(categories[0]));
      console.log('Sample data:', JSON.stringify(categories[0], null, 2));
    } else {
      console.log('DATABASE EXECUTION: UNVERIFIED (Empty table)');
    }
  }

  const { data: posts, error: postErr } = await supabase
    .from('zoal_blog_posts')
    .select('id, title, category_id');

  if (postErr) {
    console.error('Error fetching posts:', postErr);
  } else {
    console.log(`Total Posts found: ${posts?.length || 0}`);
  }
}

audit();
