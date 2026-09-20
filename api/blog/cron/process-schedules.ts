import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://jglveforpqhioxpambbq.supabase.co';

function getSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service-role client is not configured.');
  }

  return createClient(url.replace(/\/$/, ''), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function processScheduledBlogPosts() {
  const supabase = getSupabaseClient();
  const nowISO = new Date().toISOString();

  const { data: dueSchedules, error } = await supabase
    .from('zoal_blog_schedules')
    .select('id, post_id, scheduled_publish_at, status, retry_count')
    .in('status', ['pending', 'failed'])
    .lte('scheduled_publish_at', nowISO);

  if (error) throw error;
  if (!dueSchedules || dueSchedules.length === 0) return 0;

  let processed = 0;

  for (const schedule of dueSchedules) {
    const retryCount = schedule.retry_count || 0;
    if (schedule.status === 'failed' && retryCount >= 3) continue;

    const { data: locked, error: lockErr } = await supabase
      .from('zoal_blog_schedules')
      .update({ status: 'executed', updated_at: nowISO })
      .eq('id', schedule.id)
      .in('status', ['pending', 'failed'])
      .select('id');

    if (lockErr || !locked || locked.length === 0) continue;

    const { error: postErr } = await supabase
      .from('zoal_blog_posts')
      .update({
        status: 'published',
        published_at: schedule.scheduled_publish_at || nowISO,
        updated_at: nowISO
      })
      .eq('id', schedule.post_id);

    if (postErr) {
      await supabase
        .from('zoal_blog_schedules')
        .update({
          status: 'failed',
          retry_count: retryCount + 1,
          error_message: postErr.message || 'Unknown publication error',
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id);
      continue;
    }

    await supabase.from('zoal_blog_audit_logs').insert({
      action: 'AUTOMATIC_SCHEDULED_PUBLISH',
      entity: 'zoal_blog_posts',
      entity_id: schedule.post_id,
      actor: 'SYSTEM_SCHEDULER',
      details: {
        schedule_id: schedule.id,
        scheduled_time: schedule.scheduled_publish_at
      }
    });

    processed += 1;
  }

  return processed;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return res.status(503).json({ error: 'Cron endpoint is not configured.' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  const providedSecret =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.headers['x-cron-secret'];

  if (!providedSecret || providedSecret !== configuredSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const processed = await processScheduledBlogPosts();
    return res.status(200).json({
      success: true,
      processed,
      message: 'Scheduled blog posts processing completed.'
    });
  } catch (error: any) {
    console.error('[Blog Scheduler Cron Endpoint] Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Scheduler processing failed.'
    });
  }
}
