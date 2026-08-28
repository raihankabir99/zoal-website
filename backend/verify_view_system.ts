
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseKey = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyViewSystem() {
  console.log('--- VIEW SYSTEM VERIFICATION ---');

  // 1. Check zoal_blog_views table
  const { data: views, error: viewError } = await supabase
    .from('zoal_blog_views')
    .select('id')
    .limit(1);

  if (viewError) {
    console.error('Table zoal_blog_views Verification FAILED:', viewError.message);
  } else {
    console.log('RESULT: Table zoal_blog_views EXISTS.');
  }

  // 2. Check RPC increment_view_count
  // We can't directly check if RPC exists with anon key usually, but we can try to call it with a fake ID
  const { error: rpcError } = await supabase.rpc('increment_view_count', { post_id: '00000000-0000-0000-0000-000000000000' });

  if (rpcError) {
    console.log('RPC Call status:', rpcError.message);
    if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
        console.log('RESULT: RPC increment_view_count is MISSING.');
    } else {
        console.log('RESULT: RPC increment_view_count likely EXISTS (Error was probably just "id not found" or similar).');
    }
  } else {
    console.log('RESULT: RPC increment_view_count EXISTS.');
  }
}

verifyViewSystem();
