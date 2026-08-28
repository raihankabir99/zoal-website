import { getServiceSupabaseClient } from '../server/supabase';
import crypto from 'crypto';

async function verifyAll() {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    console.error('❌ Supabase service client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set.');
    return;
  }

  console.log('--- STARTING FORENSIC VERIFICATION ---');

  try {
    // 1. Category Creation
    const categoryId = crypto.randomUUID();
    const { error: catErr } = await supabase.from('zoal_blog_categories').insert({
      id: categoryId,
      name: 'Forensic Test',
      slug: 'forensic-test-' + Date.now(),
      display_order: 999,
      is_active: true
    });
    if (catErr) throw new Error('Failed to create test category: ' + catErr.message);
    console.log('✅ Test category created');

    // 2. Post Creation (Draft)
    const postId = crypto.randomUUID();
    const { error: postErr } = await supabase.from('zoal_blog_posts').insert({
      id: postId,
      title: 'Forensic Test Post',
      slug: 'forensic-test-post-' + Date.now(),
      category_id: categoryId,
      status: 'draft',
      content: 'Test content',
      view_count: 0
    });
    if (postErr) throw new Error('Failed to create test post: ' + postErr.message);
    console.log('✅ Test post created (draft)');

    // 3. Scheduling
    const scheduleId = crypto.randomUUID();
    const scheduledAt = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
    const { error: schedErr } = await supabase.from('zoal_blog_schedules').insert({
      id: scheduleId,
      post_id: postId,
      scheduled_publish_at: scheduledAt,
      status: 'pending'
    });
    if (schedErr) throw new Error('Failed to create test schedule: ' + schedErr.message);
    console.log('✅ Test schedule created (due)');

    // 4. Wait for background worker
    console.log('⏳ Waiting 35s for the background worker interval (30s) to process the schedule...');
    await new Promise(r => setTimeout(r, 35000));

    // 5. Verify Publication
    const { data: updatedPost, error: verifyErr } = await supabase.from('zoal_blog_posts').select('status, published_at').eq('id', postId).single();
    if (verifyErr) throw new Error('Failed to verify post status: ' + verifyErr.message);

    if (updatedPost?.status === 'published') {
      console.log('✅ WORKER SUCCESS: Post was automatically published.');
    } else {
      console.log('❌ WORKER FAILURE: Post is still status:', updatedPost?.status);
      // Let's check the schedule status too
      const { data: schedData } = await supabase.from('zoal_blog_schedules').select('*').eq('id', scheduleId).single();
      console.log('Schedule status in DB:', schedData?.status, 'Retry count:', schedData?.retry_count, 'Error:', schedData?.error_message);
    }

    // 6. Verify RPC View Increment
    console.log('⏳ Testing RPC increment_view_count...');
    const { error: rpcErr } = await supabase.rpc('increment_view_count', { post_id: postId });
    if (rpcErr) {
      console.log('❌ RPC FAILURE:', rpcErr.message);
    } else {
      const { data: verifiedPost } = await supabase.from('zoal_blog_posts').select('view_count').eq('id', postId).single();
      if (verifiedPost?.view_count === 1) {
        console.log('✅ RPC SUCCESS: View count incremented correctly.');
      } else {
        console.log('❌ RPC DATA DISCREPANCY: Expected 1, got', verifiedPost?.view_count);
      }
    }

    // 7. Cleanup
    console.log('🧹 Cleaning up test data...');
    await supabase.from('zoal_blog_schedules').delete().eq('id', scheduleId);
    await supabase.from('zoal_blog_posts').delete().eq('id', postId);
    await supabase.from('zoal_blog_categories').delete().eq('id', categoryId);
    console.log('✅ Cleanup complete');

  } catch (err: any) {
    console.error('❌ FORENSIC ERROR:', err.message);
  }
}

verifyAll();
