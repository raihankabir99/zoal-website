import express, { Request, Response } from 'express';
import { getServiceSupabaseClient } from '../server/supabase.ts';
import { updateCmsPage } from '../server/cms.ts';
import { authenticateRequest, requireRole } from '../backend/security.ts';

const app = express();
app.use(express.json({ limit: '2mb' }));

/**
 * Public storefront CMS contract.
 * Only content that is explicitly active/published is returned.
 * Admin/private metadata is never exposed through this route.
 */
app.get('/api/cms', async (_req: Request, res: Response) => {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const [pagesResult, sectionsResult, heroesResult, editorialResult, featuredCategoriesResult, featuredProductsResult, showcasesResult, promotionsResult, statisticsResult, testimonialsResult, brandsResult, newsletterResult] = await Promise.all([
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
      .from('zoal_homepage_heroes')
      .select('id,hero_title,hero_title_ar,hero_subtitle,hero_subtitle_ar,hero_description,hero_description_ar,hero_image_desktop,hero_image_mobile,cta_text,cta_text_ar,cta_link,overlay_opacity,display_order,priority,active,start_date,end_date,seo_title,seo_title_ar,seo_description,seo_description_ar,seo_og_image,seo_og_image_ar,seo_twitter_image,seo_twitter_image_ar,seo_json_ld,seo_canonical_url,created_at,updated_at')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_editorial_blocks')
      .select('id,slug,category,category_ar,title,title_ar,description,description_ar,button_text,button_text_ar,button_link,desktop_image,mobile_image,background_text,background_text_ar,layout_type,theme,animation_type,display_order,priority,status,seo_title,seo_title_ar,seo_description,seo_description_ar,seo_keywords,seo_keywords_ar,og_image,canonical_url,json_ld,schedule_start,schedule_end,subtitle,subtitle_ar,created_at,updated_at')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_featured_categories')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_featured_products')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_showcases')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_promotions')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_statistics')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_testimonials')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_brands')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true }),
    supabase
      .from('zoal_homepage_newsletter')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
  ]);

  const results = [pagesResult, sectionsResult, heroesResult, editorialResult, featuredCategoriesResult, featuredProductsResult, showcasesResult, promotionsResult, statisticsResult, testimonialsResult, brandsResult, newsletterResult];
  const firstError = results.find(result => result.error)?.error;
  if (firstError) {
    console.error('[CMS API] public read failed', firstError);
    return res.status(500).json({ error: 'Failed to fetch published CMS data.' });
  }

  const sections = sectionsResult.data || [];
  const heroes = heroesResult.data || [];

  return res.json({
    pages: pagesResult.data || [],
    sections,
    banners: heroes,
    blocks: editorialResult.data || [],
    homepageSections: sections,
    heroes,
    editorialBlocks: editorialResult.data || [],
    featuredCategories: featuredCategoriesResult.data || [],
    featuredProducts: featuredProductsResult.data || [],
    showcases: showcasesResult.data || [],
    promotions: promotionsResult.data || [],
    statistics: statisticsResult.data || [],
    testimonials: testimonialsResult.data || [],
    brands: brandsResult.data || [],
    newsletter: newsletterResult.data || []
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
