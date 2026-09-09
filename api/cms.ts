import express, { Request, Response } from 'express';
import { getServiceSupabaseClient } from '../server/supabase.ts';
import { updateCmsPage } from '../server/cms.ts';
import { authenticateRequest, requireRole } from '../backend/security.ts';

const app = express();
app.use(express.json({ limit: '2mb' }));

/**
 * Public storefront contract.
 * Only published/active CMS content is exposed. Drafts, internal metadata,
 * and unpublished records are never returned by this endpoint.
 */
app.get('/api/cms', async (_req: Request, res: Response) => {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const [pagesResult, sectionsResult, bannersResult, blocksResult] = await Promise.all([
    supabase
      .from('zoal_cms_pages')
      .select('id,slug,title,content_json,published,created_at,updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('zoal_homepage_sections')
      .select('id,section_key,title,title_ar,subtitle,subtitle_ar,description,description_ar,is_active,display_order,status,settings_json,seo_title,seo_title_ar,seo_description,seo_description_ar,seo_keywords,og_image,canonical_url,created_at,updated_at')
      .eq('is_active', true)
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_banners')
      .select('id,title,subtitle,image_url,link_url,is_active,created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('zoal_homepage_blocks')
      .select('id,block_type,title,content_json,order_index,is_active,created_at')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
  ]);

  const firstError = pagesResult.error || sectionsResult.error || bannersResult.error || blocksResult.error;
  if (firstError) {
    console.error('[CMS API] public read failed', firstError);
    return res.status(500).json({ error: 'Failed to fetch published CMS data.' });
  }

  return res.json({
    pages: pagesResult.data || [],
    sections: sectionsResult.data || [],
    banners: bannersResult.data || [],
    blocks: blocksResult.data || []
  });
});

// Admin page mutations remain authenticated and role-protected.
app.put(
  '/api/cms/pages/:id',
  authenticateRequest,
  requireRole(['staff', 'manager', 'admin', 'owner']),
  updateCmsPage
);

export default app;
