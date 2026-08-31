import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import { syncSupabaseUser } from '../backend/security';

async function getOptionalUser(req: any) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  
  if (!headerValue || !headerValue.startsWith('Bearer ')) return null;
  const token = headerValue.substring(7);
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const fullUser = await syncSupabaseUser(user);
    return fullUser;
  } catch (e) {
    return null;
  }
}

function isPrivilegedBlogRole(role: string): boolean {
  return ['owner', 'admin', 'manager', 'staff'].includes(role);
}

// Helper to resolve the blog author record for a given Supabase user
async function getAuthorByUserInfo(supabase: any, user: any) {
  if (!user) return null;
  
  const isUuid = user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
  let query = supabase.from('zoal_blog_authors').select('*');
  if (isUuid) {
    query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
  } else {
    query = query.eq('email', user.email);
  }
  
  let { data: author } = await query.maybeSingle();
  if (!author && user.email) {
    const { data: newAuthor } = await supabase.from('zoal_blog_authors').insert({
      user_id: isUuid ? user.id : null,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      bio: 'Enterprise Content Contributor',
      status: 'active'
    }).select().single();
    author = newAuthor;
  }
  return author;
}

// Helper to validate author_id exists in database
async function validateAuthorExists(supabase: any, authorId: string): Promise<boolean> {
  if (!authorId) return true;
  const { data } = await supabase
    .from('zoal_blog_authors')
    .select('id')
    .eq('id', authorId)
    .maybeSingle();
  return !!data;
}

// --- BLOG POSTS ---
export async function getBlogPosts(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { category, tag, search, status, limit = '50', page = '1' } = req.query;

  // Verify status access
  let targetStatus = 'published';
  if (status) {
    if (status !== 'published') {
      const user = await getOptionalUser(req);
      const role = user ? user.role : null;
      if (role && ['owner', 'admin', 'manager', 'staff', 'editor', 'author'].includes(role)) {
        targetStatus = status as string;
      } else {
        return res.status(403).json({ error: 'Forbidden', message: 'Access denied to unpublished posts.' });
      }
    } else {
      targetStatus = 'published';
    }
  }

  let query = supabase.from('zoal_blog_posts').select(`
    *,
    zoal_blog_authors (id, name, name_ar, bio, bio_ar, avatar_url, expertise, expertise_ar),
    zoal_blog_categories (id, name, name_ar, slug, parent_id)
  `, { count: 'exact' });

  query = query.eq('status', targetStatus);

  if (category) {
    query = query.eq('category_id', category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const lim = parseInt(limit as string, 10) || 50;
  const pge = parseInt(page as string, 10) || 1;
  const offset = (pge - 1) * lim;

  query = query.order('created_at', { ascending: false }).range(offset, offset + lim - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const posts = data || [];

  // Attach tag_ids to posts
  if (posts.length > 0) {
    const postIds = posts.map((p: any) => p.id);
    const { data: postTags } = await supabase
      .from('zoal_blog_post_tags')
      .select('post_id, tag_id')
      .in('post_id', postIds);

    if (postTags) {
      const tagMap = new Map<string, string[]>();
      postTags.forEach((pt: any) => {
        if (!tagMap.has(pt.post_id)) tagMap.set(pt.post_id, []);
        tagMap.get(pt.post_id)!.push(pt.tag_id);
      });
      posts.forEach((p: any) => {
        p.tag_ids = tagMap.get(p.id) || [];
      });
    }
  }

  res.json({ posts, page: pge, limit: lim, total: count || posts.length });
}

export async function createBlogPost(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  let targetStatus = req.body.status || 'draft';

  // Role checks
  if (role === 'author') {
    if (targetStatus !== 'draft') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only create draft articles.' });
    }
  } else if (role === 'editor') {
    if (targetStatus === 'published' || targetStatus === 'archived') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors cannot publish or archive articles on creation.' });
    }
  } else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  // Author assignment validation
  let finalAuthorId = req.body.author_id || null;
  if (role === 'author') {
    const authorRecord = await getAuthorByUserInfo(supabase, user);
    if (!authorRecord) {
      return res.status(403).json({ error: 'Forbidden', message: 'No active author profile found.' });
    }
    finalAuthorId = authorRecord.id;
  } else if (finalAuthorId) {
    const isValid = await validateAuthorExists(supabase, finalAuthorId);
    if (!isValid) {
      return res.status(400).json({ error: 'Bad Request', message: `Invalid author_id: '${finalAuthorId}' does not exist in zoal_blog_authors.` });
    }
  }

  const { tag_ids, view_count, like_count, comment_count, ...bodyProps } = req.body;

  const payload = {
    ...bodyProps,
    author_id: finalAuthorId,
    status: targetStatus,
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    slug: req.body.slug || req.body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    reading_time: req.body.reading_time || Math.max(1, Math.ceil((req.body.content || '').split(' ').length / 200)),
    created_by: user.email || user.name || 'CMS User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('zoal_blog_posts').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Sync tags
  if (Array.isArray(tag_ids) && tag_ids.length > 0) {
    const tagRows = tag_ids.map((tagId: string) => ({
      post_id: data.id,
      tag_id: tagId,
      status: 'active'
    }));
    await supabase.from('zoal_blog_post_tags').insert(tagRows);
    data.tag_ids = tag_ids;
  }

  // Audit log
  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'CREATE_POST',
    entity: 'zoal_blog_posts',
    entity_id: data.id,
    actor: user.email,
    details: { title: data.title, role: user.role, status: data.status }
  });

  res.status(201).json(data);
}

export async function updateBlogPost(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  // Fetch current post
  const { data: postBeforeUpdate, error: fetchError } = await supabase
    .from('zoal_blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !postBeforeUpdate) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const currentStatus = postBeforeUpdate.status;
  const targetStatus = req.body.status || currentStatus;

  // Author permissions
  if (role === 'author') {
    if (currentStatus !== 'draft') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only edit draft articles.' });
    }
    if (targetStatus !== 'draft' && targetStatus !== 'review') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only keep articles in draft or submit for review.' });
    }

    const userAuthor = await getAuthorByUserInfo(supabase, user);
    if (!userAuthor || postBeforeUpdate.author_id !== userAuthor.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only edit their own draft articles.' });
    }
  } 
  // Editor permissions
  else if (role === 'editor') {
    if (targetStatus === 'published') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors cannot publish articles directly.' });
    }
    if (targetStatus === 'archived') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors cannot archive articles.' });
    }
  } 
  // Privileged check
  else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  // Validate author_id if passed and changed
  if (req.body.author_id && req.body.author_id !== postBeforeUpdate.author_id) {
    if (role === 'author') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors cannot reassign article authorship.' });
    }
    const isValid = await validateAuthorExists(supabase, req.body.author_id);
    if (!isValid) {
      return res.status(400).json({ error: 'Bad Request', message: `Invalid author_id: '${req.body.author_id}' does not exist in zoal_blog_authors.` });
    }
  }

  const { tag_ids, view_count, like_count, comment_count, ...bodyProps } = req.body;

  const payload = {
    ...bodyProps,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('zoal_blog_posts').update(payload).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Sync tags
  if (Array.isArray(tag_ids)) {
    await supabase.from('zoal_blog_post_tags').delete().eq('post_id', id);
    if (tag_ids.length > 0) {
      const tagRows = tag_ids.map((tagId: string) => ({
        post_id: id,
        tag_id: tagId,
        status: 'active'
      }));
      await supabase.from('zoal_blog_post_tags').insert(tagRows);
    }
    data.tag_ids = tag_ids;
  }

  // Audit log
  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'UPDATE_POST',
    entity: 'zoal_blog_posts',
    entity_id: id,
    actor: user.email,
    details: { title: data.title, role: user.role, status: data.status }
  });

  res.json(data);
}

export async function deleteBlogPost(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: post, error: fetchError } = await supabase
    .from('zoal_blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  if (role === 'author' || role === 'editor') {
    return res.status(403).json({ error: 'Forbidden', message: `${role.toUpperCase()}s are not authorized to archive/delete articles.` });
  } else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  const { error } = await supabase
    .from('zoal_blog_posts')
    .update({ deleted_at: new Date().toISOString(), status: 'archived' })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  // Also cancel pending schedules for this post
  await supabase
    .from('zoal_blog_schedules')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('post_id', id)
    .eq('status', 'pending');

  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'ARCHIVE_POST',
    entity: 'zoal_blog_posts',
    entity_id: id,
    actor: user.email,
    details: { title: post.title, role: user.role }
  });

  res.json({ success: true, message: 'Post archived successfully.' });
}

// --- SCHEDULES & AUTOMATIC PUBLISHER ---

export async function processScheduledBlogPosts() {
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return;

  try {
    const nowISO = new Date().toISOString();
    // Fetch pending schedules, or failed ones with less than 3 retries, that are due
    const { data: dueSchedules, error } = await supabase
      .from('zoal_blog_schedules')
      .select('id, post_id, scheduled_publish_at, status, retry_count')
      .in('status', ['pending', 'failed'])
      .lte('scheduled_publish_at', nowISO);

    if (error || !dueSchedules || dueSchedules.length === 0) return;

    for (const schedule of dueSchedules) {
      const retryCount = schedule.retry_count || 0;
      if (schedule.status === 'failed' && retryCount >= 3) {
        continue; // Skip if max retries reached
      }

      // Lock schedule: update status to 'executed' optimistically to avoid double processing
      const { data, error: lockErr } = await supabase
        .from('zoal_blog_schedules')
        .update({ 
          status: 'executed', 
          updated_at: nowISO 
        })
        .eq('id', schedule.id)
        .in('status', ['pending', 'failed'])
        .select();

      if (lockErr || !data || data.length === 0) {
        console.warn(`[Blog Scheduler] Failed to lock schedule ${schedule.id} or already processed by another worker.`);
        continue;
      }

      // Publish post
      const { error: postErr } = await supabase
        .from('zoal_blog_posts')
        .update({
          status: 'published',
          published_at: schedule.scheduled_publish_at || nowISO,
          updated_at: nowISO
        })
        .eq('id', schedule.post_id);

      if (postErr) {
        const nextRetry = retryCount + 1;
        console.error(`[Blog Scheduler] Failed setting post ${schedule.post_id} to published (Attempt ${nextRetry}/3):`, postErr);
        
        // Revert schedule to 'failed' status with incremented retry count and error message
        await supabase
          .from('zoal_blog_schedules')
          .update({
            status: 'failed',
            retry_count: nextRetry,
            error_message: postErr.message || 'Unknown publication error',
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id);
      } else {
        console.log(`[Blog Scheduler] Automatically published post ${schedule.post_id} from schedule ${schedule.id}`);
        await supabase.from('zoal_blog_audit_logs').insert({
          action: 'AUTOMATIC_SCHEDULED_PUBLISH',
          entity: 'zoal_blog_posts',
          entity_id: schedule.post_id,
          actor: 'SYSTEM_SCHEDULER',
          details: { schedule_id: schedule.id, scheduled_time: schedule.scheduled_publish_at }
        });
      }
    }
  } catch (err) {
    console.error('[Blog Scheduler] Error processing scheduled posts:', err);
  }
}

// Run worker interval continuously
if (typeof setInterval !== 'undefined') {
  setTimeout(() => {
    processScheduledBlogPosts().catch(err => console.error('Initial scheduler run error:', err));
  }, 2000);

  setInterval(() => {
    processScheduledBlogPosts().catch(err => console.error('Interval scheduler run error:', err));
  }, 30000);
}

export async function scheduleBlogPost(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  const allowedRoles = ['owner', 'admin', 'manager', 'staff', 'editor', 'author'];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Only authorized CMS users can schedule posts.' });
  }

  const { post_id, scheduled_publish_at } = req.body;
  if (!post_id || !scheduled_publish_at) {
    return res.status(400).json({ error: 'Bad Request', message: 'post_id and scheduled_publish_at are required.' });
  }

  const scheduledDate = new Date(scheduled_publish_at);
  if (isNaN(scheduledDate.getTime())) {
    return res.status(400).json({ error: 'Bad Request', message: 'scheduled_publish_at must be a valid ISO date.' });
  }

  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  // Fetch post
  const { data: post, error: fetchErr } = await supabase
    .from('zoal_blog_posts')
    .select('*')
    .eq('id', post_id)
    .single();

  if (fetchErr || !post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  // Prevent scheduling already-published posts
  if (post.status === 'published') {
    return res.status(400).json({ error: 'Bad Request', message: 'Already-published articles cannot be scheduled.' });
  }

  // Author permissions check
  if (role === 'author') {
    const userAuthor = await getAuthorByUserInfo(supabase, user);
    if (!userAuthor || post.author_id !== userAuthor.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only schedule their own articles.' });
    }
  }

  // Deactivate prior pending schedules for this post
  await supabase
    .from('zoal_blog_schedules')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('post_id', post_id)
    .eq('status', 'pending');

  // Insert new schedule
  const { data: schedule, error: schedErr } = await supabase
    .from('zoal_blog_schedules')
    .insert({
      post_id,
      scheduled_publish_at: scheduledDate.toISOString(),
      status: 'pending',
      created_by: user.email || 'CMS User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (schedErr) {
    return res.status(500).json({ error: schedErr.message });
  }

  // Update post status to 'scheduled'
  await supabase
    .from('zoal_blog_posts')
    .update({ status: 'scheduled', updated_at: new Date().toISOString() })
    .eq('id', post_id);

  // Trigger immediate check in case schedule is due right away
  processScheduledBlogPosts().catch(() => {});

  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'SCHEDULE_POST',
    entity: 'zoal_blog_posts',
    entity_id: post_id,
    actor: user.email,
    details: { scheduled_publish_at: scheduledDate.toISOString(), schedule_id: schedule.id }
  });

  res.status(201).json({
    message: 'Post scheduled successfully.',
    schedule,
    post_id,
    scheduled_publish_at: scheduledDate.toISOString()
  });
}

export async function cancelPostSchedule(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  const allowedRoles = ['owner', 'admin', 'manager', 'staff', 'editor', 'author'];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Only authorized CMS users can cancel schedules.' });
  }

  const post_id = req.body.post_id || req.params.postId;
  if (!post_id) {
    return res.status(400).json({ error: 'Bad Request', message: 'post_id is required.' });
  }

  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: post } = await supabase.from('zoal_blog_posts').select('*').eq('id', post_id).maybeSingle();
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  if (role === 'author') {
    const userAuthor = await getAuthorByUserInfo(supabase, user);
    if (!userAuthor || post.author_id !== userAuthor.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only cancel schedules for their own articles.' });
    }
  }

  // Cancel all pending schedules
  await supabase
    .from('zoal_blog_schedules')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('post_id', post_id)
    .eq('status', 'pending');

  // Reset post status to draft if currently scheduled
  if (post.status === 'scheduled') {
    await supabase
      .from('zoal_blog_posts')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', post_id);
  }

  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'CANCEL_SCHEDULE',
    entity: 'zoal_blog_posts',
    entity_id: post_id,
    actor: user.email,
    details: { post_id }
  });

  res.json({ success: true, message: 'Schedule cancelled and post status reverted to draft.' });
}

export async function getSchedules(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  const allowedRoles = ['owner', 'admin', 'manager', 'staff', 'editor', 'author'];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Only authorized CMS users can view schedules.' });
  }

  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { postId } = req.query;
  let query = supabase.from('zoal_blog_schedules').select('*, zoal_blog_posts(id, title, slug, status)');
  
  if (postId) {
    query = query.eq('post_id', postId as string);
  }

  // If the user is an author, they should only view schedules of their own posts.
  // We can do this in the app layer after fetching, or filter by author_id if we fetch author info.
  // Let's do a safe filter:
  if (role === 'author') {
    const userAuthor = await getAuthorByUserInfo(supabase, user);
    if (!userAuthor) {
      return res.json([]);
    }
    // We can filter by querying only schedules for posts owned by this author.
    // Let's get the author's post IDs first.
    const { data: authorPosts } = await supabase.from('zoal_blog_posts').select('id').eq('author_id', userAuthor.id);
    const authorPostIds = (authorPosts || []).map(p => p.id);
    if (authorPostIds.length === 0) {
      return res.json([]);
    }
    query = query.in('post_id', authorPostIds);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

// --- CATEGORIES ---
export async function getCategories(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase
    .from('zoal_blog_categories')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function createCategory(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || (!isPrivilegedBlogRole(user.role) && user.role !== 'editor')) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles or editors can manage categories.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const payload = {
    ...req.body,
    slug: req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  };

  const { data, error } = await supabase.from('zoal_blog_categories').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;
  if (!user || (!isPrivilegedBlogRole(user.role) && user.role !== 'editor')) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles or editors can manage categories.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_categories').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can delete categories.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase.from('zoal_blog_categories').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// --- TAGS ---
export async function getTags(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_tags').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function createTag(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || (!isPrivilegedBlogRole(user.role) && user.role !== 'editor')) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles or editors can manage tags.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const payload = {
    ...req.body,
    slug: req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  };

  const { data, error } = await supabase.from('zoal_blog_tags').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function deleteTag(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can delete tags.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase.from('zoal_blog_tags').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// --- COMMENTS ---
export async function getComments(req: Request, res: Response) {
  const { postId } = req.query;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const user = await getOptionalUser(req);
  const isStaff = user && (isPrivilegedBlogRole(user.role) || user.role === 'editor');

  let query = supabase.from('zoal_blog_comments').select('*').order('created_at', { ascending: true });
  if (postId) query = query.eq('post_id', postId as string);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const rawComments = data || [];

  // Filter comments by status:
  // Staff sees all comments.
  // Non-staff see approved comments OR their own pending comments (strictly by created_by user ID).
  const visibleComments = rawComments.filter((c: any) => {
    if (isStaff) return true;
    if (c.status === 'approved') return true;
    if (user && user.id && c.created_by === user.id) return true;
    return false;
  });

  // Strip PII (author_email) for non-staff / non-owners
  const sanitizedComments = visibleComments.map((c: any) => {
    const isOwner = Boolean(user && user.id && c.created_by === user.id);
    if (!isStaff && !isOwner) {
      const { author_email, ...safeComment } = c;
      return safeComment;
    }
    return c;
  });

  res.json(sanitizedComments);
}

export async function createComment(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required to post comments.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { post_id, parent_id, content } = req.body;
  if (!post_id) {
    return res.status(400).json({ error: 'Bad Request', message: 'post_id is required.' });
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Bad Request', message: 'Comment content cannot be empty.' });
  }

  // Derive identity strictly from authenticated user/session (anti-spoofing)
  const author_email = user.email;
  const author_name = user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) || (user.email ? user.email.split('@')[0] : 'Authenticated User');
  const isStaff = isPrivilegedBlogRole(user.role) || user.role === 'editor';

  // Enforce moderation queue status: default 'pending' for regular customers
  const status = isStaff && req.body.status ? req.body.status : 'pending';

  const payload = {
    post_id,
    parent_id: parent_id || null,
    author_name,
    author_email,
    content: content.trim(),
    status,
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('zoal_blog_comments').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Sanitize author_email in response if non-staff
  if (!isStaff) {
    const { author_email: _, ...safeData } = data;
    return res.status(201).json(safeData);
  }

  res.status(201).json(data);
}

export async function updateCommentStatus(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  // Fetch comment to verify existence and check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('zoal_blog_comments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!existing) return res.status(404).json({ error: 'Comment not found.' });

  const isStaff = isPrivilegedBlogRole(user.role) || user.role === 'editor';
  const isOwner = Boolean(user && user.id && existing.created_by === user.id);

  if (!isStaff && !isOwner) {
    return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to update this comment.' });
  }

  const { status, content } = req.body;
  const updates: any = {};

  if (status !== undefined) {
    if (!isStaff) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only staff or admins can change comment moderation status.' });
    }
    updates.status = status;
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }
    updates.content = content.trim();
    updates.updated_at = new Date().toISOString();
    updates.updated_by = user.id;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update.' });
  }

  const { data, error } = await supabase.from('zoal_blog_comments').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  if (!isStaff) {
    const { author_email: _, ...safeData } = data;
    return res.json(safeData);
  }

  res.json(data);
}

export async function deleteComment(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  // Fetch comment to verify existence and check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('zoal_blog_comments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!existing) return res.status(404).json({ error: 'Comment not found.' });

  const isStaff = isPrivilegedBlogRole(user.role) || user.role === 'editor';
  const isOwner = Boolean(user && user.id && existing.created_by === user.id);

  if (!isStaff && !isOwner) {
    return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to delete this comment.' });
  }

  const { error } = await supabase.from('zoal_blog_comments').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
}

// --- AUTHORS ---
export async function getAuthors(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_authors').select('*').order('name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function createAuthor(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage authors.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_authors').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

// --- MEDIA ---
export async function getMedia(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_media').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function uploadMedia(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const payload = {
    ...req.body,
    created_by: user.email || 'CMS User',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('zoal_blog_media').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateMedia(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_media').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function deleteMedia(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase.from('zoal_blog_media').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// --- SEO ---
export async function getSeo(req: Request, res: Response) {
  const { postId } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_seo').select('*').eq('post_id', postId).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || {});
}

export async function upsertSeo(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: 'post_id is required.' });

  const { data, error } = await supabase.from('zoal_blog_seo').upsert(req.body, { onConflict: 'post_id' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// --- SEARCH & UTILS ---
export async function searchBlog(req: Request, res: Response) {
  const { q } = req.query;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  if (!q) return res.json([]);

  const { data, error } = await supabase
    .from('zoal_blog_posts')
    .select('id, title, title_ar, slug, excerpt, excerpt_ar, published_at')
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function generateBlogSitemap(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).send('Database error');

  const { data } = await supabase.from('zoal_blog_posts').select('slug, updated_at').eq('status', 'published');
  
  const host = req.headers.host || 'alzoal.com';
  const protocol = req.secure ? 'https' : 'http';
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  (data || []).forEach((post: any) => {
    xml += `  <url>\n    <loc>${protocol}://${host}/blog/${post.slug}</loc>\n    <lastmod>${post.updated_at ? post.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });
  
  xml += '</urlset>';
  res.header('Content-Type', 'application/xml');
  res.send(xml);
}

export async function generateBlogRss(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).send('Database error');

  const { data } = await supabase.from('zoal_blog_posts').select('title, slug, excerpt, published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(20);

  const host = req.headers.host || 'alzoal.com';
  const protocol = req.secure ? 'https' : 'http';

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>AL ZOAL Blog & News</title>
  <link>${protocol}://${host}/blog</link>
  <description>Latest insights and enterprise news from AL ZOAL</description>
`;

  (data || []).forEach((post: any) => {
    rss += `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${protocol}://${host}/blog/${post.slug}</link>
    <description><![CDATA[${post.excerpt || ''}]]></description>
    <pubDate>${post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString()}</pubDate>
  </item>\n`;
  });

  rss += `</channel>\n</rss>`;
  res.header('Content-Type', 'application/xml');
  res.send(rss);
}

export async function subscribeNewsletter(req: Request, res: Response) {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address required.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_newsletters').upsert({ email, subscribed: true, status: 'active' }, { onConflict: 'email' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Subscribed successfully.', data });
}

// --- REVISIONS ---
export async function getRevisions(req: Request, res: Response) {
  const { postId } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_revisions').select('*').eq('post_id', postId).order('revision_number', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function createRevision(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { post_id, title, content } = req.body;
  if (!post_id || !title || !content) {
    return res.status(400).json({ error: 'post_id, title, and content are required.' });
  }

  const { data: post, error: postError } = await supabase.from('zoal_blog_posts').select('*').eq('id', post_id).single();
  if (postError || !post) {
    return res.status(404).json({ error: 'Associated blog post not found.' });
  }

  const role = user.role;
  if (role === 'author') {
    if (post.status !== 'draft') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only create revisions for draft articles.' });
    }
    const author = await getAuthorByUserInfo(supabase, user);
    if (!author || post.author_id !== author.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only create revisions for their own draft articles.' });
    }
  } else if (!isPrivilegedBlogRole(role) && role !== 'editor') {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  const { data: revs } = await supabase
    .from('zoal_blog_revisions')
    .select('revision_number')
    .eq('post_id', post_id)
    .order('revision_number', { ascending: false })
    .limit(1);

  let nextRev = 1;
  if (revs && revs.length > 0) {
    nextRev = (revs[0].revision_number || 0) + 1;
  }

  const { data, error } = await supabase
    .from('zoal_blog_revisions')
    .insert({
      post_id,
      title,
      content,
      revision_number: nextRev,
      created_by: user.name || user.email || 'Anonymous Editor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function getBlogPostById(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase
    .from('zoal_blog_posts')
    .select(`
      *,
      zoal_blog_authors (id, name, name_ar, bio, bio_ar, avatar_url, expertise, expertise_ar),
      zoal_blog_categories (id, name, name_ar, slug, parent_id)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Post not found.' });

  // Access verification for unpublished posts
  if (data.status !== 'published') {
    const user = await getOptionalUser(req);
    const role = user ? user.role : null;
    if (!role || !['owner', 'admin', 'manager', 'staff', 'editor', 'author'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to unpublished posts.' });
    }
  }

  res.json(data);
}

export async function getBlogPostPreview(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user; // Set by authenticateRequest
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  if (!['owner', 'admin', 'manager', 'staff', 'editor', 'author'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions for preview.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase
    .from('zoal_blog_posts')
    .select(`
      *,
      zoal_blog_authors (id, name, name_ar, bio, bio_ar, avatar_url, expertise, expertise_ar),
      zoal_blog_categories (id, name, name_ar, slug, parent_id)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Post not found.' });

  res.json(data);
}

export async function trackBlogPostView(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Bad Request', message: 'Post ID is required.' });
  }

  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not initialized.' });
  }

  try {
    // 1. Validate article existence and published status
    const { data: post, error: fetchErr } = await supabase
      .from('zoal_blog_posts')
      .select('id, status, view_count')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !post) {
      return res.status(404).json({ error: 'Not Found', message: 'Article not found.' });
    }

    // Require published status for public views
    if (post.status !== 'published') {
      return res.json({ success: true, message: 'View not counted for unpublished post.', current_views: post.view_count || 0 });
    }

    // 2. Prevent obvious refresh/spam inflation using a hashed IP and user agent check in the last 24h
    const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'unknown-ua';

    // Hash IP address with post ID for privacy-safe tracking
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(`${ipAddress}-${id}`).digest('hex');

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Check for existing view
    const { data: existingView } = await supabase
      .from('zoal_blog_views')
      .select('id')
      .eq('post_id', id)
      .eq('ip_address', ipHash)
      .gte('created_at', oneDayAgo)
      .maybeSingle();

    if (existingView) {
      return res.json({ success: true, message: 'View already counted recently (idempotent).', current_views: post.view_count || 0 });
    }

    // 3. Record new view
    const { error: insertErr } = await supabase
      .from('zoal_blog_views')
      .insert({
        post_id: id,
        ip_address: ipHash,
        user_agent: userAgent,
        status: 'active',
        created_by: (req as any).user?.email || 'guest'
      });

    if (insertErr) {
      console.error(`[Blog Views] Failed to record view for post ${id}:`, insertErr);
      return res.status(500).json({ error: 'Database Error', message: 'Failed to record view.' });
    }

    // 4. Increment view_count atomically using postgres rpc
    const { error: rpcErr } = await supabase.rpc('increment_view_count', { post_id: id });

    if (rpcErr) {
      console.error(`[Blog Views] Critical failure: RPC increment_view_count failed for post ${id}:`, rpcErr);
      return res.status(500).json({ error: 'Database Error', message: 'Failed to record view.' });
    }

    return res.json({ success: true, message: 'View tracked successfully.', current_views: (post.view_count || 0) + 1 });
  } catch (err: any) {
    console.error('[Blog Views] Error tracking view:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
