import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../helpers';

/**
 * GET /api/products
 * Retrieves product catalog with pagination, filtering, and sorting, supporting 100% enterprise fields.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) {
    return apiError('Too many requests. Please try again later.', 429);
  }

  try {
    const url = new URL(req.url);
    
    // Pagination parameters
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // Filters
    const categoryId = url.searchParams.get('categoryId');
    const brandId = url.searchParams.get('brandId');
    const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999');
    const isActive = url.searchParams.get('isActive') !== 'false';

    // Sorting parameters
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let query = supabase
      .from('zoal_products')
      .select('*', { count: 'exact' });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }
    query = query.gte('price', minPrice).lte('price', maxPrice);

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return apiError(error.message, 500);
    }

    return apiResponse({
      products: products || [],
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/products
 * Creates a new product with 100% enterprise field mapping (Localization, SEO, Variants, Shipping, Compliance, AI Metadata).
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) {
    return apiError('Too many requests', 429);
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return apiError('Unauthorized', 401);
    }

    const body = await req.json();
    
    // Validation
    const required = ['name', 'slug', 'price'];
    for (const f of required) {
      if (!body[f]) {
        return apiError(`Validation failed. Missing required field: ${f}`, 400);
      }
    }

    const productPayload = {
      name: body.name,
      name_en: body.nameEn || body.name_en || body.name,
      name_ar: body.nameAr || body.name_ar || '',
      slug: body.slug,
      description: body.description || '',
      sub_description: body.subDescription || body.sub_description || '',
      short_description: body.shortDescription || body.short_description || '',
      highlights: body.highlights || '',
      story: body.story || '',
      ingredients: body.ingredients || '',
      directions: body.directions || '',
      warnings: body.warnings || '',
      price: parseFloat(body.price),
      sale_price: body.salePrice !== undefined ? parseFloat(body.salePrice) : (body.sale_price || null),
      cost_price: body.costPrice !== undefined ? parseFloat(body.costPrice) : (body.cost_price || null),
      profit_margin: body.profitMargin !== undefined ? parseFloat(body.profitMargin) : (body.profit_margin || null),
      currency: body.currency || 'AED',
      tax_class: body.taxClass || body.tax_class || 'standard',
      vat_class: body.vatClass || body.vat_class || 'standard',
      sku: body.sku || `ZL-${Date.now().toString().slice(-6)}`,
      barcode: body.barcode || '',
      inventory: body.inventory !== undefined ? parseInt(body.inventory, 10) : 100,
      min_stock: body.minStock !== undefined ? parseInt(body.minStock, 10) : 5,
      max_stock: body.maxStock !== undefined ? parseInt(body.maxStock, 10) : 1000,
      low_stock_threshold: body.lowStockThreshold !== undefined ? parseInt(body.lowStockThreshold, 10) : 10,
      warehouse_location: body.warehouseLocation || 'Main Hub - Dubai',
      reserved_stock: body.reservedStock || 0,
      status: body.status || 'Active',
      visibility: body.visibility || 'Public',
      is_featured: !!body.isFeatured || !!body.featured || !!body.is_featured,
      featured: !!body.featured || !!body.isFeatured,
      is_best_seller: !!body.isBestSeller || !!body.is_best_seller,
      is_new_arrival: !!body.isNewArrival || !!body.is_new_arrival,
      is_flash_sale: !!body.isFlashSale || !!body.is_flash_sale,
      is_recommended: !!body.isRecommended || !!body.is_recommended,
      category: body.category || 'coffee',
      category_id: body.category_id || 'cat-1',
      brand: body.brand || '',
      brand_id: body.brand_id || null,
      subcategory: body.subcategory || '',
      collection_name: body.collection || body.collection_name || '',
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? String(body.tags).split(',').map(s => s.trim()) : []),
      labels: Array.isArray(body.labels) ? body.labels : (body.labels ? String(body.labels).split(',').map(s => s.trim()) : []),
      image_urls: body.images || body.image_urls || [],
      images_360: body.images360 || body.images_360 || [],
      video_url: body.videoUrl || body.video_url || '',
      seo_meta_title: body.seoMetaTitle || body.seo_meta_title || '',
      seo_meta_desc: body.seoMetaDesc || body.seo_meta_desc || '',
      seo_meta_keywords: body.seoMetaKeywords || body.seo_meta_keywords || '',
      seo_slug: body.seoSlug || body.seo_slug || '',
      seo_open_graph_image: body.seoOpenGraphImage || body.seo_open_graph_image || '',
      seo_canonical_url: body.seoCanonicalUrl || body.seo_canonical_url || '',
      seo_schema_product_data: body.seoSchemaProductData || body.seo_schema_product_data || '',
      seo_robots: body.seoRobots || body.seo_robots || 'index, follow',
      seo_twitter_card: body.seoTwitterCard || body.seo_twitter_card || 'summary_large_image',
      seo_focus_keyword: body.seoFocusKeyword || body.seo_focus_keyword || '',
      ai_product_summary: body.aiProductSummary || body.ai_product_summary || '',
      ai_seo_suggestions: body.aiSeoSuggestions || body.ai_seo_suggestions || '',
      ai_translation_ar: body.aiTranslationAr || body.ai_translation_ar || '',
      ai_translation_en: body.aiTranslationEn || body.ai_translation_en || '',
      ai_product_recommendation: body.aiProductRecommendation || body.ai_product_recommendation || '',
      ai_search_optimization: body.aiSearchOptimization || body.ai_search_optimization || '',
      ai_metadata: body.aiMetadata || body.ai_metadata || {},
      delivery_type: body.deliveryType || body.delivery_type || 'NATIONWIDE',
      shipping_fee: body.shippingFee !== undefined ? parseFloat(body.shippingFee) : 0,
      delivery_days: body.deliveryDays !== undefined ? parseInt(body.deliveryDays, 10) : 3,
      shipping_class: body.shippingClass || body.shipping_class || 'Standard',
      weight: body.weight !== undefined ? parseFloat(body.weight) : 0.5,
      dimensions: body.dimensions || { length: 10, width: 10, height: 10, unit: 'cm' },
      supplier: body.supplier || '',
      manufacturer: body.manufacturer || '',
      country_of_origin: body.countryOfOrigin || body.country_of_origin || 'Sudan',
      importer: body.importer || '',
      hs_code: body.hsCode || body.hs_code || '0901.21',
      halal_status: body.halalStatus || body.halal_status || 'Certified',
      halal_certified: body.halalCertified !== undefined ? !!body.halalCertified : true,
      expiry_date: body.expiryDate || body.expiry_date || null,
      manufacturing_date: body.manufacturingDate || body.manufacturing_date || null,
      specifications: body.specifications || {},
      variants_list: body.variantsList || body.variants_list || [],
      reusable_attributes: body.reusableAttributes || body.reusable_attributes || {},
      faqs: body.faqs || [],
      reviews: body.reviews || [],
      downloads: body.downloads || [],
      custom_fields: body.customFields || body.custom_fields || {},
      is_active: body.is_active !== false
    };

    const { data: newProduct, error } = await supabase
      .from('zoal_products')
      .insert(productPayload)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 500);
    }

    return apiResponse(newProduct, 201);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

