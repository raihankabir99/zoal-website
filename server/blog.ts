import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

// --- BLOG POSTS ---
export async function getBlogPosts(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { category, tag, search, status, limit = '20', page = '1' } = req.query;
  let query = supabase.from('zoal_blog_posts').select('*, zoal_blog_authors(name, avatar_url), zoal_blog_categories(name, slug)');

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.eq('status', 'published');
  }

  if (category) {
    query = query.eq('category_id', category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const lim = parseInt(limit as string, 10) || 20;
  const pge = parseInt(page as string, 10) || 1;
  const offset = (pge - 1) * lim;

  query = query.order('created_at', { ascending: false }).range(offset, offset + lim - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ posts: data || [], page: pge, limit: lim, total: count });
}

// Helper to resolve the blog author record for a given Supabase user
async function getAuthorByUserInfo(supabase: any, user: any) {
  if (!user) return null;
  
  // Try finding by user_id first if it looks like a valid UUID, or find by email
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
  let query = supabase.from('zoal_blog_authors').select('id');
  if (isUuid) {
    query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
  } else {
    query = query.eq('email', user.email);
  }
  
  const { data: author } = await query.maybeSingle();
  return author;
}

function isPrivilegedBlogRole(role: string): boolean {
  return ['owner', 'admin', 'manager', 'staff'].includes(role);
}

export async function createBlogPost(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const role = user.role;
  const status = req.body.status || 'draft';

  // Check general permission
  if (role === 'author') {
    if (status !== 'draft') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only create draft articles.' });
    }
  } else if (role === 'editor') {
    if (status === 'published' || status === 'archived') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors cannot publish or archive articles on creation.' });
    }
  } else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const payload = {
    ...req.body,
    slug: req.body.slug || req.body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    reading_time: req.body.reading_time || Math.ceil((req.body.content || '').split(' ').length / 200),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('zoal_blog_posts').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Log audit
  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'CREATE_POST',
    entity: 'zoal_blog_posts',
    entity_id: data.id,
    details: { title: data.title, user_email: user.email, role: user.role }
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

  // Fetch current post to verify status and ownership
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

  // Enforce Author permissions
  if (role === 'author') {
    if (currentStatus !== 'draft') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only edit draft articles.' });
    }
    if (targetStatus !== 'draft') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors cannot publish or move articles out of draft.' });
    }

    // Verify ownership
    const author = await getAuthorByUserInfo(supabase, user);
    if (!author || postBeforeUpdate.author_id !== author.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only edit their own draft articles.' });
    }
  } 
  // Enforce Editor permissions
  else if (role === 'editor') {
    // Cannot Publish
    if (targetStatus === 'published') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors cannot publish articles.' });
    }
    // Cannot Archive
    if (targetStatus === 'archived') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors cannot archive articles.' });
    }
    // "Move Draft -> In Review", "Move Review -> Draft"
    if (targetStatus !== 'draft' && targetStatus !== 'review' && targetStatus !== 'in_review') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors can only move articles to draft or in review.' });
    }
  } 
  // Verify Admin/Owner/Manager/Staff
  else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  const payload = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('zoal_blog_posts').update(payload).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Log audit
  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'UPDATE_POST',
    entity: 'zoal_blog_posts',
    entity_id: id,
    details: { title: data.title, user_email: user.email, role: user.role }
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

  // Fetch current post
  const { data: postBeforeUpdate, error: fetchError } = await supabase
    .from('zoal_blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !postBeforeUpdate) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  // Author & Editor cannot archive
  if (role === 'author' || role === 'editor') {
    return res.status(403).json({ error: 'Forbidden', message: `${role.toUpperCase()}s are not authorized to archive/delete articles.` });
  } else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  const { error } = await supabase.from('zoal_blog_posts').update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  // Log audit
  await supabase.from('zoal_blog_audit_logs').insert({
    action: 'ARCHIVE_POST',
    entity: 'zoal_blog_posts',
    entity_id: id,
    details: { title: postBeforeUpdate.title, user_email: user.email, role: user.role }
  });

  res.json({ success: true, message: 'Post archived successfully.' });
}

// --- CATEGORIES ---
export async function getCategories(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_categories').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function createCategory(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage categories.' });
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
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage categories.' });
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
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage categories.' });
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
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage tags.' });
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
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage tags.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase.from('zoal_blog_tags').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// --- COMMENTS ---
export async function getComments(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { postId } = req.query;
  let query = supabase.from('zoal_blog_comments').select('*, zoal_blog_posts(title, slug)');
  if (postId) {
    query = query.eq('post_id', postId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function createComment(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_comments').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateCommentStatus(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can moderate comments.' });
  }

  const { id } = req.params;
  const { status } = req.body;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_comments').update({ status }).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function deleteComment(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can moderate comments.' });
  }

  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase.from('zoal_blog_comments').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

// --- AUTHORS ---
export async function getAuthors(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_authors').select('*');
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
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage media.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { filename, file_url, file_type, file_size, bucket_name, alt_text, caption, original_url, webp_url } = req.body;
  const { data, error } = await supabase.from('zoal_blog_media').insert({
    filename, 
    file_url, 
    file_type, 
    file_size, 
    bucket_name: bucket_name || 'blog-images',
    alt_text,
    caption,
    original_url,
    webp_url
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateMedia(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage media.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { id } = req.params;
  const { alt_text, caption, file_url, original_url, webp_url, filename, file_type, file_size } = req.body;
  
  const { data, error } = await supabase.from('zoal_blog_media').update({
    alt_text,
    caption,
    file_url,
    original_url,
    webp_url,
    filename,
    file_type,
    file_size,
    updated_at: new Date().toISOString()
  }).eq('id', id).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function deleteMedia(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user || !isPrivilegedBlogRole(user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Only privileged roles can manage media.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { id } = req.params;
  
  // First, query the media item to find out its bucket and filenames so we can clean up Supabase storage
  const { data: mediaItem, error: fetchError } = await supabase.from('zoal_blog_media').select('*').eq('id', id).single();
  if (fetchError || !mediaItem) {
    return res.status(404).json({ error: 'Media asset not found.' });
  }

  // Delete from storage if urls exist
  try {
    const bucket = mediaItem.bucket_name || 'blog-images';
    const getPathFromUrl = (url: string) => {
      if (!url) return null;
      try {
        const parts = url.split(`/storage/v1/object/public/${bucket}/`);
        if (parts.length > 1) return parts[1];
        return null;
      } catch (e) {
        return null;
      }
    };

    const filesToDelete: string[] = [];
    if (mediaItem.file_url) {
      const p = getPathFromUrl(mediaItem.file_url);
      if (p) filesToDelete.push(p);
    }
    if (mediaItem.original_url) {
      const p = getPathFromUrl(mediaItem.original_url);
      if (p) filesToDelete.push(p);
    }
    if (mediaItem.webp_url) {
      const p = getPathFromUrl(mediaItem.webp_url);
      if (p) filesToDelete.push(p);
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from(bucket).remove(filesToDelete);
    }
  } catch (err) {
    console.warn('Could not delete files from Supabase storage, proceeding to delete DB record:', err);
  }

  const { error } = await supabase.from('zoal_blog_media').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
}

// --- SEO ---
export async function getSeo(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { postId } = req.params;
  const { data, error } = await supabase.from('zoal_blog_seo').select('*').eq('post_id', postId).single();
  if (error) return res.status(404).json({ error: 'SEO record not found.' });
  res.json(data);
}

export async function upsertSeo(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { post_id } = req.body;
  if (!post_id) {
    return res.status(400).json({ error: 'post_id is required.' });
  }

  // Fetch associated blog post to verify permissions
  const { data: post, error: postError } = await supabase.from('zoal_blog_posts').select('*').eq('id', post_id).single();
  if (postError || !post) {
    return res.status(404).json({ error: 'Associated blog post not found.' });
  }

  const role = user.role;
  if (role === 'author') {
    if (post.status !== 'draft') {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only edit SEO for draft articles.' });
    }
    const author = await getAuthorByUserInfo(supabase, user);
    if (!author || post.author_id !== author.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Authors can only edit SEO for their own draft articles.' });
    }
  } else if (role === 'editor') {
    // Editor can edit any post
  } else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  const { data, error } = await supabase.from('zoal_blog_seo').upsert(req.body, { onConflict: 'post_id' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// --- SEARCH ---
export async function searchBlog(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { q } = req.query;
  if (!q) return res.json([]);

  const { data, error } = await supabase
    .from('zoal_blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at')
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

// --- SITEMAP & RSS ---
export async function generateBlogSitemap(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).send('Supabase not configured');

  const { data: posts } = await supabase.from('zoal_blog_posts').select('slug, updated_at').eq('status', 'published');
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  (posts || []).forEach((p: any) => {
    xml += `  <url>\n    <loc>https://alzoalalraqi.com/blog/${p.slug}</loc>\n    <lastmod>${p.updated_at}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  });
  xml += '</urlset>';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
}

export async function generateBlogRss(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).send('Supabase not configured');

  const { data: posts } = await supabase.from('zoal_blog_posts').select('title, slug, excerpt, published_at').eq('status', 'published').limit(20);

  let rss = '<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n';
  rss += '<title>Al Zoal Al Raqi Enterprise Blog</title>\n<link>https://alzoalalraqi.com/blog</link>\n<description>Luxury Sudanese fashion, artisan coffee, and heritage news</description>\n';
  
  (posts || []).forEach((p: any) => {
    rss += `  <item>\n    <title><![CDATA[${p.title}]]></title>\n    <link>https://alzoalalraqi.com/blog/${p.slug}</link>\n    <description><![CDATA[${p.excerpt || ''}]]></description>\n    <pubDate>${p.published_at}</pubDate>\n  </item>\n`;
  });
  rss += '</channel>\n</rss>';

  res.header('Content-Type', 'application/rss+xml');
  res.send(rss);
}

// --- NEWSLETTER ---
export async function subscribeNewsletter(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const { data, error } = await supabase.from('zoal_blog_newsletters').upsert({ email, subscribed: true }, { onConflict: 'email' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data });
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

  // Fetch associated blog post to verify permissions
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
  } else if (role === 'editor') {
    // Editor can edit any post
  } else if (!isPrivilegedBlogRole(role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Insufficient privileges.' });
  }

  // Get current max revision number
  const { data: revs, error: revError } = await supabase
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

// --- SCHEDULES ---
export async function getSchedules(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_schedules').select('*, zoal_blog_posts(title, slug)');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}
