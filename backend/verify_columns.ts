
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseKey = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('--- COLUMN EXISTENCE VERIFICATION ---');

  const { data, error } = await supabase
    .from('zoal_blog_categories')
    .select('id, name, name_ar, slug, display_order, is_active, icon')
    .limit(1);

  if (error) {
    console.error('Column Verification FAILED:', error.message);
    if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('RESULT: Migration 036 columns are MISSING.');
    }
  } else {
    console.log('RESULT: Migration 036 columns EXIST (Verified via explicit SELECT).');
  }
}

checkColumns();
