
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseKey = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPostColumns() {
  console.log('--- POSTS COLUMN VERIFICATION ---');

  const { data, error } = await supabase
    .from('zoal_blog_posts')
    .select('id, title, category_id, view_count')
    .limit(1);

  if (error) {
    console.error('Column Verification FAILED:', error.message);
  } else {
    console.log('RESULT: zoal_blog_posts columns (category_id, view_count) EXIST.');
  }
}

checkPostColumns();
