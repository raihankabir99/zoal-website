import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../../helpers';

/**
 * GET /api/products/[id]
 * Retrieves a single product by ID or slug with 100% enterprise fields.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) {
    return apiError('Too many requests. Please try again later.', 429);
  }

  try {
    const { id } = params;
    let query = supabase.from('zoal_products').select('*');
    
    if (id.length === 36 || !isNaN(Number(id))) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: product, error } = await query.single();

    if (error || !product) {
      return apiError('Product not found', 404);
    }

    return apiResponse(product);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * PUT /api/products/[id]
 * Updates an existing product with 100% enterprise field mapping.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) {
    return apiError('Too many requests', 429);
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return apiError('Unauthorized', 401);
    }

    const { id } = params;
    const body = await req.json();

    const updatePayload: Record<string, any> = {};

    if (body.name !== undefined) {
      updatePayload.name = body.name;
      updatePayload.name_en = body.nameEn || body.name_en || body.name;
    }
    if (body.nameEn !== undefined || body.name_en !== undefined) {
      updatePayload.name_en = body.nameEn || body.name_en;
    }
    if (body.nameAr !== undefined || body.name_ar !== undefined) {
      updatePayload.name_ar = body.nameAr || body.name_ar;
    }
    if (body.slug !== undefined) updatePayload.slug = body.slug;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.subDescription !== undefined || body.sub_description !== undefined) {
      updatePayload.sub_description = body.subDescription || body.sub_description;
    }
    if (body.shortDescription !== undefined || body.short_description !== undefined) {
      updatePayload.short_description = body.shortDescription || body.short_description;
    }
    if (body.highlights !== undefined) updatePayload.highlights = body.highlights;
    if (body.story !== undefined) updatePayload.story = body.story;
    if (body.ingredients !== undefined) updatePayload.ingredients = body.ingredients;
    if (body.directions !== undefined) updatePayload.directions = body.directions;
    if (body.warnings !== undefined) updatePayload.warnings = body.warnings;
    if (body.price !== undefined) updatePayload.price = parseFloat(body.price);
    if (body.salePrice !== undefined || body.sale_price !== undefined) {
      updatePayload.sale_price = body.salePrice !== null ? parseFloat(body.salePrice) : body.sale_price;
    }
    if (body.costPrice !== undefined || body.cost_price !== undefined) {
      updatePayload.cost_price = body.costPrice !== null ? parseFloat(body.costPrice) : body.cost_price;
    }
    if (body.profitMargin !== undefined || body.profit_margin !== undefined) {
      updatePayload.profit_margin = body.profitMargin !== null ? parseFloat(body.profitMargin) : body.profit_margin;
    }
    if (body.currency !== undefined) updatePayload.currency = body.currency;
    if (body.taxClass !== undefined || body.tax_class !== undefined) {
      updatePayload.tax_class = body.taxClass || body.tax_class;
    }
    if (body.vatClass !== undefined || body.vat_class !== undefined) {
      updatePayload.vat_class = body.vatClass || body.vat_class;
    }
    if (body.sku !== undefined) updatePayload.sku = body.sku;
    if (body.barcode !== undefined) updatePayload.barcode = body.barcode;
    if (body.inventory !== undefined) updatePayload.inventory = parseInt(body.inventory, 10);
    if (body.minStock !== undefined || body.min_stock !== undefined) {
      updatePayload.min_stock = parseInt(body.minStock || body.min_stock, 10);
    }
    if (body.maxStock !== undefined || body.max_stock !== undefined) {
      updatePayload.max_stock = parseInt(body.maxStock || body.max_stock, 10);
    }
    if (body.lowStockThreshold !== undefined || body.low_stock_threshold !== undefined) {
      updatePayload.low_stock_threshold = parseInt(body.lowStockThreshold || body.low_stock_threshold, 10);
    }
    if (body.warehouseLocation !== undefined || body.warehouse_location !== undefined) {
      updatePayload.warehouse_location = body.warehouseLocation || body.warehouse_location;
    }
    if (body.reservedStock !== undefined || body.reserved_stock !== undefined) {
      updatePayload.reserved_stock = parseInt(body.reservedStock || body.reserved_stock, 10);
    }
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.visibility !== undefined) updatePayload.visibility = body.visibility;
    if (body.isFeatured !== undefined || body.featured !== undefined || body.is_featured !== undefined) {
      const val = !!body.isFeatured || !!body.featured || !!body.is_featured;
      updatePayload.is_featured = val;
      updatePayload.featured = val;
    }
    if (body.isBestSeller !== undefined || body.is_best_seller !== undefined) {
      updatePayload.is_best_seller = !!body.isBestSeller || !!body.is_best_seller;
    }
    if (body.isNewArrival !== undefined || body.is_new_arrival !== undefined) {
      updatePayload.is_new_arrival = !!body.isNewArrival || !!body.is_new_arrival;
    }
    if (body.isFlashSale !== undefined || body.is_flash_sale !== undefined) {
      updatePayload.is_flash_sale = !!body.isFlashSale || !!body.is_flash_sale;
    }
    if (body.isRecommended !== undefined || body.is_recommended !== undefined) {
      updatePayload.is_recommended = !!body.isRecommended || !!body.is_recommended;
    }
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.categoryId !== undefined || body.category_id !== undefined) {
      updatePayload.category_id = body.categoryId || body.category_id;
    }
    if (body.brand !== undefined) updatePayload.brand = body.brand;
    if (body.brandId !== undefined || body.brand_id !== undefined) {
      updatePayload.brand_id = body.brandId || body.brand_id;
    }
    if (body.subcategory !== undefined) updatePayload.subcategory = body.subcategory;
    if (body.collection !== undefined || body.collection_name !== undefined) {
      updatePayload.collection_name = body.collection || body.collection_name;
    }
    if (body.tags !== undefined) {
      updatePayload.tags = Array.isArray(body.tags) ? body.tags : String(body.tags).split(',').map(s => s.trim());
    }
    if (body.labels !== undefined) {
      updatePayload.labels = Array.isArray(body.labels) ? body.labels : String(body.labels).split(',').map(s => s.trim());
    }
    if (body.images !== undefined || body.image_urls !== undefined) {
      updatePayload.image_urls = body.images || body.image_urls;
    }
    if (body.images360 !== undefined || body.images_360 !== undefined) {
      updatePayload.images_360 = body.images360 || body.images_360;
    }
    if (body.videoUrl !== undefined || body.video_url !== undefined) {
      updatePayload.video_url = body.videoUrl || body.video_url;
    }
    if (body.seoMetaTitle !== undefined || body.seo_meta_title !== undefined) {
      updatePayload.seo_meta_title = body.seoMetaTitle || body.seo_meta_title;
    }
    if (body.seoMetaDesc !== undefined || body.seo_meta_desc !== undefined) {
      updatePayload.seo_meta_desc = body.seoMetaDesc || body.seo_meta_desc;
    }
    if (body.seoMetaKeywords !== undefined || body.seo_meta_keywords !== undefined) {
      updatePayload.seo_meta_keywords = body.seoMetaKeywords || body.seo_meta_keywords;
    }
    if (body.seoSlug !== undefined || body.seo_slug !== undefined) {
      updatePayload.seo_slug = body.seoSlug || body.seo_slug;
    }
    if (body.seoOpenGraphImage !== undefined || body.seo_open_graph_image !== undefined) {
      updatePayload.seo_open_graph_image = body.seoOpenGraphImage || body.seo_open_graph_image;
    }
    if (body.seoCanonicalUrl !== undefined || body.seo_canonical_url !== undefined) {
      updatePayload.seo_canonical_url = body.seoCanonicalUrl || body.seo_canonical_url;
    }
    if (body.seoSchemaProductData !== undefined || body.seo_schema_product_data !== undefined) {
      updatePayload.seo_schema_product_data = body.seoSchemaProductData || body.seo_schema_product_data;
    }
    if (body.seoRobots !== undefined || body.seo_robots !== undefined) {
      updatePayload.seo_robots = body.seoRobots || body.seo_robots;
    }
    if (body.seoTwitterCard !== undefined || body.seo_twitter_card !== undefined) {
      updatePayload.seo_twitter_card = body.seoTwitterCard || body.seo_twitter_card;
    }
    if (body.seoFocusKeyword !== undefined || body.seo_focus_keyword !== undefined) {
      updatePayload.seo_focus_keyword = body.seoFocusKeyword || body.seo_focus_keyword;
    }
    if (body.aiProductSummary !== undefined || body.ai_product_summary !== undefined) {
      updatePayload.ai_product_summary = body.aiProductSummary || body.ai_product_summary;
    }
    if (body.aiSeoSuggestions !== undefined || body.ai_seo_suggestions !== undefined) {
      updatePayload.ai_seo_suggestions = body.aiSeoSuggestions || body.ai_seo_suggestions;
    }
    if (body.aiTranslationAr !== undefined || body.ai_translation_ar !== undefined) {
      updatePayload.ai_translation_ar = body.aiTranslationAr || body.ai_translation_ar;
    }
    if (body.aiTranslationEn !== undefined || body.ai_translation_en !== undefined) {
      updatePayload.ai_translation_en = body.aiTranslationEn || body.ai_translation_en;
    }
    if (body.aiProductRecommendation !== undefined || body.ai_product_recommendation !== undefined) {
      updatePayload.ai_product_recommendation = body.aiProductRecommendation || body.ai_product_recommendation;
    }
    if (body.aiSearchOptimization !== undefined || body.ai_search_optimization !== undefined) {
      updatePayload.ai_search_optimization = body.aiSearchOptimization || body.ai_search_optimization;
    }
    if (body.aiMetadata !== undefined || body.ai_metadata !== undefined) {
      updatePayload.ai_metadata = body.aiMetadata || body.ai_metadata;
    }
    if (body.deliveryType !== undefined || body.delivery_type !== undefined) {
      updatePayload.delivery_type = body.deliveryType || body.delivery_type;
    }
    if (body.shippingFee !== undefined || body.shipping_fee !== undefined) {
      updatePayload.shipping_fee = parseFloat(body.shippingFee || body.shipping_fee);
    }
    if (body.deliveryDays !== undefined || body.delivery_days !== undefined) {
      updatePayload.delivery_days = parseInt(body.deliveryDays || body.delivery_days, 10);
    }
    if (body.shippingClass !== undefined || body.shipping_class !== undefined) {
      updatePayload.shipping_class = body.shippingClass || body.shipping_class;
    }
    if (body.weight !== undefined) {
      updatePayload.weight = parseFloat(body.weight);
    }
    if (body.dimensions !== undefined) {
      updatePayload.dimensions = body.dimensions;
    }
    if (body.supplier !== undefined) updatePayload.supplier = body.supplier;
    if (body.manufacturer !== undefined) updatePayload.manufacturer = body.manufacturer;
    if (body.countryOfOrigin !== undefined || body.country_of_origin !== undefined) {
      updatePayload.country_of_origin = body.countryOfOrigin || body.country_of_origin;
    }
    if (body.importer !== undefined) updatePayload.importer = body.importer;
    if (body.hsCode !== undefined || body.hs_code !== undefined) {
      updatePayload.hs_code = body.hsCode || body.hs_code;
    }
    if (body.halalStatus !== undefined || body.halal_status !== undefined) {
      updatePayload.halal_status = body.halalStatus || body.halal_status;
    }
    if (body.halalCertified !== undefined || body.halal_certified !== undefined) {
      updatePayload.halal_certified = !!body.halalCertified || !!body.halal_certified;
    }
    if (body.expiryDate !== undefined || body.expiry_date !== undefined) {
      updatePayload.expiry_date = body.expiryDate || body.expiry_date;
    }
    if (body.manufacturingDate !== undefined || body.manufacturing_date !== undefined) {
      updatePayload.manufacturing_date = body.manufacturingDate || body.manufacturing_date;
    }
    if (body.specifications !== undefined) updatePayload.specifications = body.specifications;
    if (body.variantsList !== undefined || body.variants_list !== undefined) {
      updatePayload.variants_list = body.variantsList || body.variants_list;
    }
    if (body.reusableAttributes !== undefined || body.reusable_attributes !== undefined) {
      updatePayload.reusable_attributes = body.reusableAttributes || body.reusable_attributes;
    }
    if (body.faqs !== undefined) updatePayload.faqs = body.faqs;
    if (body.reviews !== undefined) updatePayload.reviews = body.reviews;
    if (body.downloads !== undefined) updatePayload.downloads = body.downloads;
    if (body.customFields !== undefined || body.custom_fields !== undefined) {
      updatePayload.custom_fields = body.customFields || body.custom_fields;
    }
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;

    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedProduct, error } = await supabase
      .from('zoal_products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 500);
    }

    return apiResponse(updatedProduct);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * PATCH /api/products/[id]
 * Partial update for product fields.
 */
export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  return PUT(req, context);
}

/**
 * DELETE /api/products/[id]
 * Deletes a product.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) {
    return apiError('Too many requests', 429);
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return apiError('Unauthorized', 401);
    }

    const { id } = params;

    const { error } = await supabase
      .from('zoal_products')
      .delete()
      .eq('id', id);

    if (error) {
      return apiError(error.message, 500);
    }

    return apiResponse({ success: true, deletedId: id });
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
