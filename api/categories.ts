import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://jglveforpqhioxpambbq.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function ip(req: any) {
  const value = req.headers?.['x-forwarded-for'];
  return typeof value === 'string' ? value.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
}
function limited(req: any, res: any) {
  const key = ip(req), now = Date.now();
  let entry = rateLimitCache.get(key);
  if (!entry || now >= entry.resetTime) entry = { count: 0, resetTime: now + RATE_WINDOW_MS };
  entry.count += 1; rateLimitCache.set(key, entry);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
  if (entry.count > RATE_LIMIT) { res.status(429).json({ error: 'Too Many Requests' }); return false; }
  return true;
}
function supabaseUrl() { return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, ''); }
function serviceKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''; }
function mapPayload(raw: any) {
  return {
    name: String(raw.name || '').trim(), name_ar: raw.nameAr ?? raw.name_ar ?? null,
    slug: String(raw.slug || '').trim(), description: raw.description ?? null,
    short_description: raw.shortDescription ?? raw.short_description ?? null,
    image_url: raw.imageUrl ?? raw.image_url ?? raw.featuredImage ?? null,
    parent_id: raw.parentId ?? raw.parent_id ?? raw.parent ?? null,
    sort_order: Number.isFinite(Number(raw.sortOrder ?? raw.sort_order)) ? Number(raw.sortOrder ?? raw.sort_order) : 0,
    visibility: raw.visibility ?? 'Visible', status: raw.status ?? 'Published',
    featured_toggle: Boolean(raw.featuredToggle ?? raw.featured_toggle),
    homepage_display_toggle: Boolean(raw.homepageDisplayToggle ?? raw.homepage_display_toggle),
    category_icon: raw.categoryIcon ?? raw.category_icon ?? null,
    seo_title: raw.seoTitle ?? raw.seo_title ?? null, seo_description: raw.seoDescription ?? raw.seo_description ?? null,
    seo_keywords: raw.seoKeywords ?? raw.seo_keywords ?? null, canonical_url: raw.canonicalUrl ?? raw.canonical_url ?? null,
    open_graph_image: raw.openGraphImage ?? raw.open_graph_image ?? null, structured_data: raw.structuredData ?? raw.structured_data ?? null,
    friendly_url: raw.friendlyUrl ?? raw.friendly_url ?? null, mobile_banner_image: raw.mobileBannerImage ?? raw.mobile_banner_image ?? null,
    homepage_image: raw.homepageImage ?? raw.homepage_image ?? null, updated_at: new Date().toISOString()
  };
}
async function authenticate(req: any, adminClient: any) {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return { status: 401, message: 'Authentication required.' };
  const token = auth.slice(7).trim(); if (!token) return { status: 401, message: 'Authentication required.' };
  const response = await fetch(`${supabaseUrl()}/auth/v1/user`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) return { status: 401, message: 'Session expired or invalid token.' };
  const user = await response.json(); if (!user?.id) return { status: 401, message: 'Invalid authenticated user.' };
  const { data: profile, error } = await adminClient.from('zoal_users').select('role').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!profile?.role || !new Set(['admin','owner','manager','staff']).has(profile.role)) return { status: 403, message: 'Insufficient role for category management.' };
  return { user, role: profile.role };
}

async function duplicateTree(adminClient: any, sourceId: string, parentOverride: string | null, includeChildren: boolean, visited = new Set<string>()) {
  if (visited.has(sourceId)) throw new Error('Category hierarchy cycle detected.');
  visited.add(sourceId);
  const { data: source, error: sourceError } = await adminClient.from('zoal_categories').select('*').eq('id', sourceId).maybeSingle();
  if (sourceError) throw sourceError;
  if (!source) throw Object.assign(new Error('Source category not found'), { status: 404 });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const copy: any = { ...source };
  delete copy.id; delete copy.created_at;
  copy.name = `${source.name} (Copy)`;
  copy.slug = `${source.slug}-copy-${suffix}`;
  copy.parent_id = parentOverride;
  copy.updated_at = new Date().toISOString();
  const { data: created, error: createError } = await adminClient.from('zoal_categories').insert(copy).select('*').single();
  if (createError) throw createError;
  let duplicated = 1;
  if (includeChildren) {
    const { data: children, error: childError } = await adminClient.from('zoal_categories').select('id').eq('parent_id', sourceId).order('sort_order', { ascending: true }).order('name', { ascending: true });
    if (childError) throw childError;
    for (const child of children || []) {
      const result = await duplicateTree(adminClient, child.id, created.id, true, new Set(visited));
      duplicated += result.duplicated;
    }
  }
  return { root: created, duplicated };
}

export default async function handler(req: any, res: any) {
  if (!limited(req, res)) return;
  const key = serviceKey();
  if (!key) return res.status(503).json({ error: 'Category database is unavailable.' });
  const adminClient = createClient(supabaseUrl(), key, { auth: { autoRefreshToken: false, persistSession: false } });
  try {
    if (req.method === 'GET') {
      const { data, error } = await adminClient.from('zoal_categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }
    const auth = await authenticate(req, adminClient);
    if (auth.status) return res.status(auth.status).json({ error: 'Unauthorized', message: auth.message });

    if (req.method === 'POST') {
      const mapped = mapPayload(req.body || {});
      if (!mapped.name || !mapped.slug) return res.status(400).json({ error: 'name and slug are required' });
      const { data, error } = await adminClient.from('zoal_categories').insert(mapped).select('*').single();
      if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.message });
      return res.status(201).json({ success: true, data });
    }

    if (req.method === 'PUT') {
      const body = req.body || {}, id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ error: 'id is required' });
      const mapped = mapPayload(body); delete (mapped as any).updated_at;
      const { data, error } = await adminClient.from('zoal_categories').update({ ...mapped, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle();
      if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Category not found' });
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'DELETE') {
      if (auth.role !== 'admin' && auth.role !== 'owner') return res.status(403).json({ error: 'Only admin or owner may delete categories.' });
      const id = String((req.body || {}).id || '').trim();
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { data: children, error: childError } = await adminClient.from('zoal_categories').select('id').eq('parent_id', id).limit(1);
      if (childError) throw childError;
      if ((children || []).length) return res.status(409).json({ error: 'Category has child categories; move or merge them first.' });
      const { error } = await adminClient.from('zoal_categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method Not Allowed' });
    const body = req.body || {}, operation = body.operation;

    if (operation === 'bulk-import') {
      const items = Array.isArray(body.items) ? body.items : [], mode = body.mode;
      if (!['merge','skip'].includes(mode) || !items.length || items.length > 500) return res.status(400).json({ error: 'Invalid bulk import request' });
      const { data: existing, error } = await adminClient.from('zoal_categories').select('id,slug');
      if (error) throw error;
      const bySlug = new Map((existing || []).map((x: any) => [x.slug, x]));
      const result = { imported: 0, updated: 0, skipped: 0, failed: 0 };
      for (const raw of items) {
        const mapped = mapPayload(raw);
        if (!mapped.name || !mapped.slug) { result.failed++; continue; }
        const row = bySlug.get(mapped.slug);
        if (row && mode === 'skip') { result.skipped++; continue; }
        const q = row ? adminClient.from('zoal_categories').update(mapped).eq('id', row.id) : adminClient.from('zoal_categories').insert(mapped);
        const { error: writeError } = await q;
        if (writeError) result.failed++; else row ? result.updated++ : result.imported++;
      }
      return res.status(200).json({ success: true, ...result, mode });
    }

    if (operation === 'move') {
      const id = String(body.id || ''), parentId = body.parentId == null || body.parentId === 'root' ? null : String(body.parentId);
      if (!id || id === parentId) return res.status(400).json({ error: 'Invalid category move' });
      if (parentId) {
        const { data: parent } = await adminClient.from('zoal_categories').select('id').eq('id', parentId).maybeSingle();
        if (!parent) return res.status(404).json({ error: 'Destination parent not found' });
        let cursor = parentId;
        for (let i = 0; cursor && i < 100; i++) {
          const { data: node } = await adminClient.from('zoal_categories').select('parent_id').eq('id', cursor).maybeSingle();
          if (!node) break;
          if (node.parent_id === id) return res.status(409).json({ error: 'Cannot move beneath a descendant' });
          cursor = node.parent_id;
        }
      }
      const { data, error } = await adminClient.from('zoal_categories').update({ parent_id: parentId, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (operation === 'reorder') {
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length || items.length > 500) return res.status(400).json({ error: 'Invalid reorder request' });
      for (const item of items) {
        const sortOrder = Number(item.sortOrder);
        if (!item.id || !Number.isFinite(sortOrder)) return res.status(400).json({ error: 'Invalid reorder item' });
        const { error } = await adminClient.from('zoal_categories').update({ sort_order: sortOrder, updated_at: new Date().toISOString() }).eq('id', item.id);
        if (error) throw error;
      }
      return res.status(200).json({ success: true, updated: items.length });
    }

    if (operation === 'duplicate') {
      const sourceId = String(body.sourceId || '').trim();
      if (!sourceId) return res.status(400).json({ error: 'sourceId is required' });
      const result = await duplicateTree(adminClient, sourceId, null, Boolean(body.includeChildren));
      return res.status(200).json({ success: true, ...result });
    }

    if (operation === 'bulk-update') {
      const ids = Array.isArray(body.ids) ? [...new Set(body.ids.map((id: any) => String(id).trim()).filter(Boolean))] : [];
      const action = body.action;
      if (!ids.length || ids.length > 500) return res.status(400).json({ error: 'Invalid bulk update' });
      if (action === 'sort') return res.status(400).json({ error: 'Use reorder operation with sortOrder values for sorting.' });
      if (!['publish', 'unpublish', 'delete'].includes(action)) return res.status(400).json({ error: 'Unsupported bulk action' });
      if (action === 'delete') {
        const { data: children } = await adminClient.from('zoal_categories').select('id').in('parent_id', ids).limit(1);
        if ((children || []).length) return res.status(409).json({ error: 'Bulk delete blocked: selected categories have children' });
        const { error } = await adminClient.from('zoal_categories').delete().in('id', ids);
        if (error) throw error;
        return res.status(200).json({ success: true, deleted: ids.length });
      }
      const status = action === 'publish' ? 'Published' : 'Draft';
      const { error } = await adminClient.from('zoal_categories').update({ status, updated_at: new Date().toISOString() }).in('id', ids);
      if (error) throw error;
      return res.status(200).json({ success: true, updated: ids.length });
    }

    if (operation === 'merge') {
      const sourceId = String(body.sourceId || ''), destinationId = String(body.destinationId || '');
      if (!sourceId || !destinationId || sourceId === destinationId) return res.status(400).json({ error: 'Invalid merge' });
      const now = new Date().toISOString();
      const { data: source } = await adminClient.from('zoal_categories').select('id').eq('id', sourceId).maybeSingle();
      const { data: destination } = await adminClient.from('zoal_categories').select('id').eq('id', destinationId).maybeSingle();
      if (!source || !destination) return res.status(404).json({ error: 'Merge category not found' });
      const { error: productError } = await adminClient.from('zoal_products').update({ category_id: destinationId, updated_at: now }).eq('category_id', sourceId);
      if (productError) throw productError;
      const { data: jsonProducts, error: jsonReadError } = await adminClient.from('zoal_supabase_products').select('id,data').or(`data->>categoryId.eq.${sourceId},data->>category_id.eq.${sourceId}`);
      if (jsonReadError) throw jsonReadError;
      for (const product of jsonProducts || []) {
        const data = { ...(product.data || {}), categoryId: destinationId };
        delete data.category_id;
        const { error } = await adminClient.from('zoal_supabase_products').update({ data, updated_at: now }).eq('id', product.id);
        if (error) throw error;
      }
      const { error: childError } = await adminClient.from('zoal_categories').update({ parent_id: destinationId, updated_at: now }).eq('parent_id', sourceId);
      if (childError) throw childError;
      const archive = body.archiveSource !== false;
      const { error: sourceError } = archive
        ? await adminClient.from('zoal_categories').update({ status: 'Archived', updated_at: now }).eq('id', sourceId)
        : await adminClient.from('zoal_categories').delete().eq('id', sourceId);
      if (sourceError) throw sourceError;
      return res.status(200).json({ success: true, merged: true, sourceId, destinationId, archived: archive });
    }

    return res.status(400).json({ error: 'Unsupported category operation' });
  } catch (error: any) {
    console.error('Category API error:', error);
    const status = Number(error?.status);
    if (status === 404) return res.status(404).json({ error: error.message });
    return res.status(500).json({ error: 'Category operation unavailable.' });
  }
}
