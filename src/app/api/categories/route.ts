import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole } from '../helpers';

const MANAGEMENT_ROLES = ['admin', 'staff'] as const;

function mapCategoryPayload(body: any) {
  return {
    name: String(body.name || '').trim(),
    slug: String(body.slug || '').trim().toLowerCase(),
    description: body.description ?? null,
    image_url: body.image_url ?? body.image ?? null,
    name_ar: body.nameAr ?? body.name_ar ?? null,
    short_description: body.shortDescription ?? body.short_description ?? null,
    parent_id: body.parentId ?? body.parent_id ?? null,
    sort_order: Number.isFinite(Number(body.sortOrder ?? body.sort_order)) ? Number(body.sortOrder ?? body.sort_order) : 0,
    visibility: body.visibility || 'Visible',
    status: body.status || 'Published',
    featured_toggle: Boolean(body.featuredToggle ?? body.isFeatured),
    homepage_display_toggle: Boolean(body.homepageDisplayToggle ?? body.homepageDisplay),
    category_icon: body.categoryIcon ?? null,
    seo_title: body.seoTitle ?? null,
    seo_description: body.seoDescription ?? null,
    seo_keywords: body.seoKeywords ?? null,
    canonical_url: body.canonicalUrl ?? null,
    open_graph_image: body.openGraphImage ?? null,
    structured_data: body.structuredData ?? null,
    friendly_url: body.friendlyUrl ?? null,
    mobile_banner_image: body.mobileBannerImage ?? null,
    homepage_image: body.homepageImage ?? null,
    updated_at: new Date().toISOString()
  };
}

/** GET /api/categories — public catalog read. */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const { data, error } = await supabase
      .from('zoal_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) return apiError(error.message, 500);
    return apiResponse(data || []);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/** POST /api/categories — authenticated admin/staff creation. */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, MANAGEMENT_ROLES as any);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const payload = mapCategoryPayload(body);
    if (!payload.name || !payload.slug) return apiError('Missing required fields: name, slug', 400);

    const { data, error } = await supabase.from('zoal_categories').insert(payload).select('*').single();
    if (error) {
      const status = error.code === '23505' ? 409 : 500;
      return apiError(status === 409 ? 'Category name or slug already exists' : error.message, status);
    }
    return apiResponse(data, 201);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/** PUT /api/categories — authenticated admin/staff update. */
export async function PUT(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, MANAGEMENT_ROLES as any);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) return apiError('Category id is required', 400);
    const payload = mapCategoryPayload(body);
    if (!payload.name || !payload.slug) return apiError('Missing required fields: name, slug', 400);

    const { data, error } = await supabase.from('zoal_categories').update(payload).eq('id', id).select('*').single();
    if (error) {
      if (error.code === 'PGRST116') return apiError('Category not found', 404);
      const status = error.code === '23505' ? 409 : 500;
      return apiError(status === 409 ? 'Category name or slug already exists' : error.message, status);
    }
    return apiResponse(data);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/** DELETE /api/categories — authenticated admin/staff deletion. */
export async function DELETE(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, MANAGEMENT_ROLES as any);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) return apiError('Category id is required', 400);

    const { data: children, error: childError } = await supabase
      .from('zoal_categories').select('id').eq('parent_id', id).limit(1);
    if (childError) return apiError(childError.message, 500);
    if ((children || []).length > 0) return apiError('Category has child categories; re-parent or remove children first', 409);

    const { data, error } = await supabase.from('zoal_categories').delete().eq('id', id).select('id').single();
    if (error) {
      if (error.code === 'PGRST116') return apiError('Category not found', 404);
      return apiError(error.message, 500);
    }
    return apiResponse({ id: data.id, deleted: true });
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
