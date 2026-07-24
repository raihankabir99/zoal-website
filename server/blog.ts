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

export async function createBlogPost(req: Request, res: Response) {
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
    details: { title: data.title }
  });

  res.status(201).json(data);
}

export async function updateBlogPost(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const payload = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('zoal_blog_posts').update(payload).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
}

export async function deleteBlogPost(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase.from('zoal_blog_posts').update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

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
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_categories').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
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
  const { id } = req.params;
  const { status } = req.body;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_comments').update({ status }).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function deleteComment(req: Request, res: Response) {
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
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { filename, file_url, file_type, file_size, bucket_name } = req.body;
  const { data, error } = await supabase.from('zoal_blog_media').insert({
    filename, file_url, file_type, file_size, bucket_name: bucket_name || 'blog-images'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
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
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

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

// --- SCHEDULES ---
export async function getSchedules(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_blog_schedules').select('*, zoal_blog_posts(title, slug)');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}
