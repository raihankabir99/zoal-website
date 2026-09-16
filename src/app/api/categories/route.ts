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

    if (operation === 'bulk-update') {
      const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((id: any) => typeof id === 'string' && id.trim()))] : [];
      const action = body.action;
      if (!ids.length || ids.length > 500) return apiError('Bulk operation requires 1–500 category ids', 400);
      if (!['publish','unpublish','delete','sort'].includes(action)) return apiError('Unsupported bulk action', 400);
      if (action === 'delete') {
        const { data: children, error: childError } = await supabase.from('zoal_categories').select('id,parent_id').in('parent_id', ids);
        if (childError) return apiError(childError.message, 500);
        if ((children || []).length) return apiError('Bulk delete blocked: selected categories still have child categories. Move or merge them first.', 409);
        const { error } = await supabase.from('zoal_categories').delete().in('id', ids);
        if (error) return apiError(error.message, 500);
        return apiResponse({ deleted: ids.length });
      }
      if (action === 'sort') {
        for (let i=0;i<ids.length;i++) {
          const { error } = await supabase.from('zoal_categories').update({ sort_order: i+1, updated_at: new Date().toISOString() }).eq('id', ids[i]);
          if (error) return apiError(error.message, 500);
        }
        return apiResponse({ updated: ids.length });
      }
      const status = action === 'publish' ? 'Published' : 'Draft';
      const { error } = await supabase.from('zoal_categories').update({ status, updated_at: new Date().toISOString() }).in('id', ids);
      if (error) return apiError(error.message, 500);
      return apiResponse({ updated: ids.length, status });
    }

    if (operation === 'duplicate') {
      const sourceId = String(body.sourceId || '').trim();
      const includeChildren = Boolean(body.includeChildren);
      if (!sourceId) return apiError('Source category id is required', 400);
      const { data: source, error } = await supabase.from('zoal_categories').select('*').eq('id', sourceId).single();
      if (error || !source) return apiError('Source category not found', 404);
      const suffix = String(Date.now());
      const rootCopy = { ...source, id: undefined, name: `${source.name} (Copy)`, slug: `${source.slug}-copy-${suffix}`, parent_id: source.parent_id, created_at: undefined, updated_at: undefined };
      const { data: created, error: createError } = await supabase.from('zoal_categories').insert(rootCopy).select('*').single();
      if (createError) return apiError(createError.message, 500);
      if (!includeChildren) return apiResponse({ root: created, duplicated: 1 });
      const queue: Array<{oldId:string;newId:string}> = [{oldId: source.id,newId: created.id}];
      let duplicated = 1;
      while (queue.length && duplicated < 500) {
        const node = queue.shift()!;
        const { data: children, error: childError } = await supabase.from('zoal_categories').select('*').eq('parent_id', node.oldId);
        if (childError) return apiError(childError.message, 500);
        for (const child of children || []) {
          const copy = { ...child, id: undefined, name: `${child.name} (Copy)`, slug: `${child.slug}-copy-${suffix}-${duplicated}`, parent_id: node.newId, created_at: undefined, updated_at: undefined };
          const { data: childCreated, error: childCreateError } = await supabase.from('zoal_categories').insert(copy).select('*').single();
          if (childCreateError) return apiError(childCreateError.message, 500);
          queue.push({oldId: child.id,newId: childCreated.id}); duplicated++;
          if (duplicated >= 500) break;
        }
      }
      return apiResponse({ root: created, duplicated });
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
      const now = new Date().toISOString();
      // Reassign relational products first; if this fails, source category remains untouched.
      const { error: productError } = await supabase.from('zoal_products').update({ category_id: destinationId, updated_at: now }).eq('category_id', sourceId);
      if (productError) return apiError(`Product reassignment failed: ${productError.message}`, 500);
      // Keep JSON product source synchronized with the relational source-of-truth.
      const { data: jsonProducts, error: jsonReadError } = await supabase.from('zoal_supabase_products').select('id,data').or(`data->>categoryId.eq.${sourceId},data->>category_id.eq.${sourceId}`);
      if (jsonReadError) return apiError(`Product metadata lookup failed: ${jsonReadError.message}`, 500);
      for (const product of jsonProducts || []) {
        const data = { ...(product.data || {}), categoryId: destinationId };
        delete data.category_id;
        const { error: jsonWriteError } = await supabase.from('zoal_supabase_products').update({ data, updated_at: now }).eq('id', product.id);
        if (jsonWriteError) return apiError(`Product metadata reassignment failed: ${jsonWriteError.message}`, 500);
      }
      const { error: childError } = await supabase.from('zoal_categories').update({ parent_id: destinationId, updated_at: now }).eq('parent_id', sourceId);
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
