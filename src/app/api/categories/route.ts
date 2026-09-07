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
export async function PATCH(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, MANAGEMENT_ROLES as any);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const operation = body?.operation;

    if (operation === 'bulk-import') {
      const mode = body.mode;
      const items = Array.isArray(body.items) ? body.items : [];
      if (!['merge', 'skip'].includes(mode)) return apiError('Unsupported import mode. Replace is intentionally disabled for safety.', 400);
      if (!items.length || items.length > 500) return apiError('Import batch must contain 1–500 records', 400);
      const { data: existing, error } = await supabase.from('zoal_categories').select('id,name,slug');
      if (error) return apiError(error.message, 500);
      const byId = new Map((existing || []).map((x: any) => [x.id, x]));
      const bySlug = new Map((existing || []).map((x: any) => [x.slug, x]));
      const result = { imported: 0, updated: 0, skipped: 0, failed: 0 };
      for (const raw of items) {
        const mapped = mapCategoryPayload(raw);
        if (!mapped.name || !mapped.slug) { result.failed++; continue; }
        const row = (raw.id && byId.get(raw.id)) || bySlug.get(mapped.slug);
        const q = row
          ? (mode === 'skip' ? null : supabase.from('zoal_categories').update(mapped).eq('id', row.id))
          : supabase.from('zoal_categories').insert(mapped);
        if (!q) { result.skipped++; continue; }
        const { error: writeError } = await q;
        if (writeError) result.failed++; else row ? result.updated++ : result.imported++;
      }
      return apiResponse({ ...result, mode, rollbackAvailable: false });
    }

    if (operation === 'move') {
      const id = String(body.id || '').trim();
      const parentId = body.parentId === null || body.parentId === 'root' ? null : String(body.parentId || '').trim();
      if (!id) return apiError('Category id is required', 400);
      if (parentId === id) return apiError('A category cannot be its own parent', 400);
      if (parentId) {
        const { data: parent, error } = await supabase.from('zoal_categories').select('id').eq('id', parentId).single();
        if (error || !parent) return apiError('Destination parent not found', 404);
        let cursor = parentId, steps = 0;
        while (cursor && steps++ < 100) {
          const { data: node } = await supabase.from('zoal_categories').select('parent_id').eq('id', cursor).single();
          if (!node) break;
          if (node.parent_id === id) return apiError('Cannot move a category beneath its own descendant', 409);
          cursor = node.parent_id;
        }
      }
      const { data, error } = await supabase.from('zoal_categories').update({ parent_id: parentId, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
      if (error) return apiError(error.message, 500);
      return apiResponse(data);
    }

    if (operation === 'reorder') {
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length || items.length > 500) return apiError('Reorder batch must contain 1–500 records', 400);
      for (const item of items) {
        if (!item?.id || !Number.isFinite(Number(item.sortOrder))) return apiError('Invalid reorder item', 400);
        const { error } = await supabase.from('zoal_categories').update({ sort_order: Number(item.sortOrder), updated_at: new Date().toISOString() }).eq('id', item.id);
        if (error) return apiError(error.message, 500);
      }
      return apiResponse({ updated: items.length });
    }

    if (operation === 'merge') {
      const sourceId = String(body.sourceId || '').trim(), destinationId = String(body.destinationId || '').trim();
      if (!sourceId || !destinationId || sourceId === destinationId) return apiError('Valid distinct source and destination category ids are required', 400);
      const { data: source } = await supabase.from('zoal_categories').select('id').eq('id', sourceId).single();
      const { data: destination } = await supabase.from('zoal_categories').select('id').eq('id', destinationId).single();
      if (!source || !destination) return apiError('Source or destination category not found', 404);
      const { error: childError } = await supabase.from('zoal_categories').update({ parent_id: destinationId, updated_at: new Date().toISOString() }).eq('parent_id', sourceId);
      if (childError) return apiError(childError.message, 500);
      const sourceAction = body.archiveSource !== false
        ? supabase.from('zoal_categories').update({ status: 'Archived', updated_at: new Date().toISOString() }).eq('id', sourceId)
        : supabase.from('zoal_categories').delete().eq('id', sourceId);
      const { error: sourceError } = await sourceAction;
      if (sourceError) return apiError(sourceError.message, 500);
      return apiResponse({ merged: true, sourceId, destinationId, archived: body.archiveSource !== false });
    }

    return apiError('Unsupported category operation', 400);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
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
