
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseKey = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchedulingTable() {
  console.log('--- SCHEDULING TABLE VERIFICATION ---');

  const { data, error } = await supabase
    .from('zoal_blog_schedules')
    .select('id, post_id, scheduled_publish_at, status')
    .limit(1);

  if (error) {
    console.error('Table zoal_blog_schedules Verification FAILED:', error.message);
  } else {
    console.log('RESULT: Table zoal_blog_schedules EXISTS with correct columns.');
  }
}

verifySchedulingTable();
