import { getSupabaseClient, getServiceSupabaseClient, getCleanSupabaseUrl } from './supabase';
import { Request, Response } from 'express';

// -------------------------------------------------------------
// CENTRALIZED IMAGE URL NORMALIZATION (Option C)
// -------------------------------------------------------------
export function normalizeImageUrl(val: string | null | undefined): string | null {
  if (!val) {
    return null;
  }
  const trimmed = val.trim();
  if (trimmed === '') {
    return null;
  }
  
  const isAbsolute = trimmed.startsWith('http://') || trimmed.startsWith('https://');
  if (isAbsolute) {
    // If multiple absolute URLs were accidentally prepended, take the last one
    const lastHttp = trimmed.lastIndexOf('http://');
    const lastHttps = trimmed.lastIndexOf('https://');
    const actualLast = Math.max(lastHttp, lastHttps);
    if (actualLast > 0) {
      return trimmed.substring(actualLast);
    }
    return trimmed;
  }

  // Extract filename from relative path (e.g., /src/assets/images/hero-fashion.jpg -> hero-fashion.jpg)
  let filename = trimmed;
  const lastSlash = trimmed.lastIndexOf('/');
  if (lastSlash !== -1) {
    filename = trimmed.substring(lastSlash + 1);
  }

  const baseUrl = getCleanSupabaseUrl();
  let output = '';
  if (!baseUrl) {
    if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('/assets/')) {
      output = trimmed;
    } else {
      output = `/local/images/${filename}`;
    }
  } else {
    output = `${baseUrl}/storage/v1/object/public/banners/${filename}`;
  }

  return output;
}

export function normalizeHeroRecord(hero: any) {
  if (!hero) return hero;
  return {
    ...hero,
    hero_image_desktop: normalizeImageUrl(hero.hero_image_desktop),
    hero_image_mobile: normalizeImageUrl(hero.hero_image_mobile)
  };
}

export async function getCmsData(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: pages, error: pagesError } = await supabase.from('zoal_cms_pages').select('*');
  const { data: sections, error: sectionsError } = await supabase.from('zoal_cms_sections').select('*');
  const { data: banners, error: bannersError } = await supabase.from('zoal_banners').select('*');
  const { data: blocks, error: blocksError } = await supabase.from('zoal_homepage_blocks').select('*');

  if (pagesError || sectionsError || bannersError || blocksError) {
    return res.status(500).json({ error: 'Failed to fetch CMS data.' });
  }

  res.json({ pages, sections, banners, blocks });
}

export async function updateCmsPage(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_cms_pages').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function getHomepageHeroes(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.json([]);

  const { data, error } = await supabase
    .from('zoal_homepage_heroes')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching homepage heroes:', error);
    return res.json([]);
  }

  const normalized = (data || []).map(normalizeHeroRecord);
  res.json(normalized);
}

export function getHeroPayload(data: any) {
  const allowedFields = [
    'hero_title', 'hero_title_ar', 'hero_subtitle', 'hero_subtitle_ar',
    'hero_description', 'hero_description_ar', 'hero_image_desktop', 'hero_image_mobile',
    'cta_text', 'cta_text_ar', 'cta_link', 'overlay_opacity', 'display_order',
    'priority', 'active', 'start_date', 'end_date',
    'seo_title', 'seo_title_ar', 'seo_description', 'seo_description_ar',
    'seo_og_image', 'seo_og_image_ar', 'seo_twitter_image', 'seo_twitter_image_ar',
    'seo_json_ld', 'seo_canonical_url'
  ];
  const payload: any = {};
  allowedFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      let val = data[field];
      if (typeof val === 'string') {
        val = val
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/');
      }

      // Convert empty strings to null for date/timestamp fields to avoid invalid timestamp syntax errors
      if ((field === 'start_date' || field === 'end_date') && (val === '' || val === null || val === undefined)) {
        val = null;
      }

      // Parse numeric fields properly
      if (field === 'overlay_opacity') {
        val = (val === '' || val === null || val === undefined) ? 0.4 : parseFloat(val);
        if (isNaN(val)) val = 0.4;
      }
      if (field === 'display_order') {
        val = (val === '' || val === null || val === undefined) ? 1 : parseInt(val, 10);
        if (isNaN(val)) val = 1;
      }
      if (field === 'priority') {
        val = (val === '' || val === null || val === undefined) ? 0 : parseInt(val, 10);
        if (isNaN(val)) val = 0;
      }

      payload[field] = val;
    }
  });
  return payload;
}

export async function createHomepageHero(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const heroData = getHeroPayload(req.body);
  const { data, error } = await supabase
    .from('zoal_homepage_heroes')
    .insert([heroData])
    .select()
    .single();

  if (error) {
    console.error('Error creating homepage hero:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(normalizeHeroRecord(data));
}

export async function updateHomepageHero(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const heroData = { ...getHeroPayload(req.body), updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('zoal_homepage_heroes')
    .update(heroData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating homepage hero:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    return res.status(500).json({ error: error.message || 'Unknown update error' });
  }

  res.json(normalizeHeroRecord(data));
}

export async function deleteHomepageHero(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase
    .from('zoal_homepage_heroes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting homepage hero:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, message: 'Hero deleted successfully.' });
}

export async function duplicateHomepageHero(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: source, error: fetchError } = await supabase
    .from('zoal_homepage_heroes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !source) {
    return res.status(404).json({ error: 'Source hero not found' });
  }

  const { id: _, created_at: __, updated_at: ___, ...copyData } = source;
  copyData.hero_title = `${copyData.hero_title} (Copy)`;
  copyData.hero_title_ar = `${copyData.hero_title_ar} (نسخة)`;
  copyData.active = false; // unpublish duplicated hero by default
  copyData.display_order = (copyData.display_order || 0) + 1;

  const { data, error } = await supabase
    .from('zoal_homepage_heroes')
    .insert([copyData])
    .select()
    .single();

  if (error) {
    console.error('Error duplicating homepage hero:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(normalizeHeroRecord(data));
}

// -------------------------------------------------------------
// HOMEPAGE EDITORIAL LOOKBOOK BLOCKS (zoal_homepage_editorial_blocks)
// -------------------------------------------------------------

let lookbookSeeded = false;

async function ensureOriginalEditorialBlocks(supabase: any) {
  const originalBlocks = [
    {
      slug: 'coffee-ritual',
      category: 'COFFEE HOUSE',
      category_ar: 'دار القهوة المختصة',
      title: 'Crafted for Every Moment',
      title_ar: 'صُنعت لكل لحظة',
      description: 'Premium specialty coffee made from carefully selected beans, delivering rich flavor, refined quality, and the true spirit of Arabian hospitality in every cup.',
      description_ar: 'قهوة مختصة فاخرة مصنوعة من حبوب منتقاة بعناية، لتقدم نكهة غنية وجودة رفيعة والروح الحقيقية للضيافة العربية في كل فنجان.',
      button_text: 'EXPLORE COFFEE HOUSE',
      button_text_ar: 'استكشف دار القهوة',
      button_link: 'store',
      desktop_image: '/src/assets/images/scroll-coffee-stage-3.jpg',
      mobile_image: '/src/assets/images/scroll-coffee-stage-3.jpg',
      background_text: 'AROMA',
      background_text_ar: 'عبير',
      layout_type: 'standard',
      theme: 'dark',
      animation_type: 'fade-up',
      display_order: 1,
      priority: 10,
      status: 'published'
    },
    {
      slug: 'artisan-bakery',
      category: 'BAKERY & SNACKS',
      category_ar: 'المخبز والمأكولات الخفيفة',
      title: 'Crafted with Heritage Baked to Perfection',
      title_ar: 'صُنعت بحرفية التراث ومخبوزة بإتقان',
      description: 'From authentic Hoboz bread to handcrafted pastries, premium biscuits, and traditional sweets—every creation reflects timeless recipes and exceptional quality.',
      description_ar: 'من خبز الهوبوز الأصيل إلى الفطائر المصنوعة يدوياً والبسكويت الفاخر والحلويات التقليدية—كل ابتكار يعكس وصفات عريقة وجودة استثنائية.',
      button_text: 'EXPLORE BAKERY',
      button_text_ar: 'استكشف المخبز',
      button_link: 'store',
      desktop_image: '/src/assets/images/scroll-bakery.jpg',
      mobile_image: '/src/assets/images/scroll-bakery.jpg',
      background_text: 'BAKED',
      background_text_ar: 'مخبوز',
      layout_type: 'reverse',
      theme: 'light',
      animation_type: 'slide-left',
      display_order: 2,
      priority: 8,
      status: 'published'
    },
    {
      slug: 'heritage-market',
      category: 'MARKET & GROCERY',
      category_ar: 'سوق المواد الغذائية',
      title: 'Fresh Essentials Every Day',
      title_ar: 'مستلزمات طازجة كل يوم',
      description: 'Discover premium groceries, fresh ingredients, daily essentials, beverages, snacks, and household products carefully selected for quality and convenience.',
      description_ar: 'اكتشف المنتجات الغذائية الفاخرة والمكونات الطازجة والمستلزمات اليومية والمشروبات والمأكولات الخفيفة المختارة بعناية للجودة والراحة.',
      button_text: 'EXPLORE MARKET',
      button_text_ar: 'استكشف السوق',
      button_link: 'store',
      desktop_image: '/images/market_grocery_official_1781633042972.jpg',
      mobile_image: '/images/market_grocery_official_1781633042972.jpg',
      background_text: 'HERITAGE',
      background_text_ar: 'تراث',
      layout_type: 'standard',
      theme: 'gold',
      animation_type: 'zoom-in',
      display_order: 3,
      priority: 6,
      status: 'published'
    },
    {
      slug: 'luxury-collections',
      category: 'PREMIUM COLLECTIONS',
      category_ar: 'التشكيلات الفاخرة',
      title: 'Fashion & Beauty',
      title_ar: 'الأزياء والجمال',
      description: "Discover Sudanese fashion, elegant women's wear, abayas, modest wear, traditional men's attire, cosmetics, perfumes, and carefully selected beauty essentials for every occasion.",
      description_ar: 'اكتشف الأزياء السودانية والملابس النسائية الأنيقة والعباءات والأزياء المحتشمة والملابس الرجالية التقليدية ومستحضرات التجميل والعطور والمستلزمات الجمالية.',
      button_text: 'EXPLORE COLLECTION',
      button_text_ar: 'استكشف التشكيلة',
      button_link: 'store',
      desktop_image: '/src/assets/images/scroll-fashion.jpg',
      mobile_image: '/src/assets/images/scroll-fashion.jpg',
      background_text: 'PRESTIGE',
      background_text_ar: 'فخامة',
      layout_type: 'reverse',
      theme: 'dark',
      animation_type: 'fade-up',
      display_order: 4,
      priority: 4,
      status: 'published'
    },
    {
      slug: 'mens-thobes',
      category: "THOBES & MEN'S WEAR",
      category_ar: 'الثياب والأزياء الرجالية',
      title: 'Timeless Sudanese Style',
      title_ar: 'أنماط سودانية خالدة',
      description: "Discover authentic Sudanese thobes and traditional men's attire, carefully selected for comfort, quality, and timeless elegance.",
      description_ar: 'اكتشف الثياب السودانية الأصيلة والأزياء الرجالية التقليدية المنتقاة بعناية للراحة والجودة والأناقة الخالدة.',
      button_text: 'SHOP THOBES',
      button_text_ar: 'تسوق الثياب',
      button_link: 'store',
      desktop_image: '/src/assets/images/thobes.jpg',
      mobile_image: '/src/assets/images/thobes.jpg',
      background_text: 'CRAFTED',
      background_text_ar: 'متقن',
      layout_type: 'standard',
      theme: 'light',
      animation_type: 'zoom-in',
      display_order: 5,
      priority: 2,
      status: 'published'
    }
  ];

  for (const block of originalBlocks) {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('zoal_homepage_editorial_blocks')
        .select('id')
        .eq('slug', block.slug)
        .maybeSingle();

      if (checkError) {
        console.error(`Error checking block ${block.slug}:`, checkError);
        continue;
      }

      if (existing) {
        // Skip updating to prevent overwriting user-modified data
        continue;
      } else {
        await supabase
          .from('zoal_homepage_editorial_blocks')
          .insert([block]);
      }
    } catch (e) {
      console.error(`Exception during seeding of block ${block.slug}:`, e);
    }
  }
}

export async function getHomepageEditorialBlocks(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.json([]);

  if (!lookbookSeeded) {
    try {
      await ensureOriginalEditorialBlocks(supabase);
      lookbookSeeded = true;
    } catch (err) {
      console.error('Error seeding original editorial blocks:', err);
    }
  }

  const { data, error } = await supabase
    .from('zoal_homepage_editorial_blocks')
    .select('*')
    .order('priority', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching editorial blocks:', error);
    return res.json([]);
  }

  res.json(data || []);
}

export function getEditorialPayload(data: any) {
  const textFields = [
    'category', 'category_ar',
    'title', 'title_ar',
    'description', 'description_ar',
    'button_text', 'button_text_ar',
    'background_text', 'background_text_ar'
  ];
  
  const payload = { ...data };
  
  textFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      let val = payload[field];
      if (typeof val === 'string') {
        payload[field] = val
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/');
      }
    }
  });
  
  return payload;
}

export async function createHomepageEditorialBlock(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const blockData = getEditorialPayload(req.body);
  const { data, error } = await supabase
    .from('zoal_homepage_editorial_blocks')
    .insert([blockData])
    .select()
    .single();

  if (error) {
    console.error('Error creating editorial block:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
}

export async function updateHomepageEditorialBlock(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const blockData = { ...getEditorialPayload(req.body), updated_at: new Date().toISOString() };
  
  const { data, error } = await supabase
    .from('zoal_homepage_editorial_blocks')
    .update(blockData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating editorial block:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}

export async function deleteHomepageEditorialBlock(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { error } = await supabase
    .from('zoal_homepage_editorial_blocks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting editorial block:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, message: 'Editorial block deleted successfully.' });
}

export async function duplicateHomepageEditorialBlock(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: source, error: fetchError } = await supabase
    .from('zoal_homepage_editorial_blocks')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !source) {
    return res.status(404).json({ error: 'Source editorial block not found' });
  }

  const { id: _, created_at: __, updated_at: ___, ...copyData } = source;
  copyData.slug = `${copyData.slug}-copy-${Math.floor(Math.random() * 10000)}`;
  copyData.title = `${copyData.title} (Copy)`;
  copyData.title_ar = `${copyData.title_ar} (نسخة)`;
  copyData.status = 'draft'; // unpublish duplicated block by default
  copyData.display_order = (copyData.display_order || 0) + 1;

  const blockData = getEditorialPayload(copyData);
  const { data, error } = await supabase
    .from('zoal_homepage_editorial_blocks')
    .insert([blockData])
    .select()
    .single();

  if (error) {
    console.error('Error duplicating editorial block:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
}


