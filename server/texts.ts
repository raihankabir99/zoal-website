import { Request, Response } from 'express';
import { getServiceSupabaseClient } from './supabase';
import { logAuditEvent } from './audit';

const ALLOWED_LOCALES = new Set(['en', 'ar']);
const ALLOWED_CATEGORIES = new Set(['ui', 'marketing']);
const ALLOWED_STATUSES = new Set(['draft', 'published']);
const KEY_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/i;
const MAX_KEY_LENGTH = 160;
const MAX_VALUE_LENGTH = 10000;

function validationError(res: Response, message: string) {
  return res.status(400).json({ error: 'Validation Error', message });
}

function normalizePayload(body: any) {
  const key = typeof body?.key === 'string' ? body.key.trim() : '';
  const locale = typeof body?.locale === 'string' ? body.locale.trim().toLowerCase() : '';
  const value = typeof body?.value === 'string' ? body.value.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim().toLowerCase() : 'ui';
  const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : 'draft';
  const isHtml = body?.is_html === true;
  const metadata = body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
    ? body.metadata
    : {};

  return { key, locale, value, category, status, isHtml, metadata };
}

function validatePayload(body: any, partial = false) {
  const payload = normalizePayload(body);

  if (!partial || body?.key !== undefined) {
    if (!payload.key || payload.key.length > MAX_KEY_LENGTH || !KEY_PATTERN.test(payload.key)) {
      return { error: 'key must be a stable i18n-compatible key (max 160 characters).' };
    }
  }

  if (!partial || body?.locale !== undefined) {
    if (!ALLOWED_LOCALES.has(payload.locale)) {
      return { error: 'locale must be en or ar.' };
    }
  }

  if (!partial || body?.value !== undefined) {
    if (!payload.value || payload.value.length > MAX_VALUE_LENGTH) {
      return { error: 'value is required and must be 10,000 characters or fewer.' };
    }
    // Phase 2 intentionally stores plain text only. HTML rendering/sanitization is a later phase.
    if (payload.isHtml || /<\/?[a-z][^>]*>/i.test(payload.value)) {
      return { error: 'HTML content is not supported by the global string API in this phase.' };
    }
  }

  if (!ALLOWED_CATEGORIES.has(payload.category)) {
    return { error: 'category must be ui or marketing.' };
  }

  if (!ALLOWED_STATUSES.has(payload.status)) {
    return { error: 'status must be draft or published.' };
  }

  return { payload };
}

function actorFromRequest(req: Request) {
  const user = (req as any).user;
  return user ? { id: user.id, email: user.email, role: user.role } : null;
}

export async function getTexts(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return res.status(503).json({ error: 'Service Unavailable', message: 'Text registry is not configured.' });
  }

  const user = (req as any).user;
  const isPrivileged = user && (user.role === 'owner' || user.role === 'admin');
  let query = supabase
    .from('zoal_strings')
    .select('id,key,locale,value,category,status,is_html,metadata,created_at,updated_at')
    .order('key', { ascending: true })
    .order('locale', { ascending: true });

  if (!isPrivileged) {
    query = query.eq('status', 'published');
  }

  if (typeof req.query.locale === 'string') {
    const locale = req.query.locale.trim().toLowerCase();
    if (!ALLOWED_LOCALES.has(locale)) return validationError(res, 'locale must be en or ar.');
    query = query.eq('locale', locale);
  }

  if (typeof req.query.category === 'string') {
    const category = req.query.category.trim().toLowerCase();
    if (!ALLOWED_CATEGORIES.has(category)) return validationError(res, 'category must be ui or marketing.');
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('❌ getTexts failed:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Unable to load global texts.' });
  }

  return res.json({ texts: data || [] });
}

export async function createText(req: Request, res: Response) {
  const validation = validatePayload(req.body);
  if ('error' in validation) return validationError(res, validation.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Service Unavailable', message: 'Text registry is not configured.' });

  const { payload } = validation;
  const { data, error } = await supabase
    .from('zoal_strings')
    .insert({
      key: payload.key,
      locale: payload.locale,
      value: payload.value,
      category: payload.category,
      status: payload.status,
      is_html: false,
      metadata: payload.metadata
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflict', message: 'A string with this key and locale already exists.' });
    }
    console.error('❌ createText failed:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Unable to create global text.' });
  }

  await logAuditEvent({
    req,
    actor: actorFromRequest(req),
    action: 'CREATE_GLOBAL_STRING',
    resourceType: 'global_string',
    resourceId: data.id,
    afterState: data,
    result: 'SUCCESS',
    severity: 'INFO',
    source: 'texts'
  });

  return res.status(201).json({ text: data });
}

export async function updateText(req: Request, res: Response) {
  const validation = validatePayload(req.body, true);
  if ('error' in validation) return validationError(res, validation.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Service Unavailable', message: 'Text registry is not configured.' });

  const { data: before, error: fetchError } = await supabase
    .from('zoal_strings')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: 'Internal Server Error', message: 'Unable to load the global text.' });
  }
  if (!before) return res.status(404).json({ error: 'Not Found', message: 'Global text not found.' });

  const body = req.body || {};
  const updates: Record<string, any> = {};
  if (body.key !== undefined) updates.key = validation.payload?.key;
  if (body.locale !== undefined) updates.locale = validation.payload?.locale;
  if (body.value !== undefined) updates.value = validation.payload?.value;
  if (body.category !== undefined) updates.category = validation.payload?.category;
  if (body.status !== undefined) updates.status = validation.payload?.status;
  if (body.metadata !== undefined) updates.metadata = validation.payload?.metadata;
  // is_html remains false in Phase 2; raw HTML is never persisted through this API.
  updates.is_html = false;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('zoal_strings')
    .update(updates)
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflict', message: 'A string with this key and locale already exists.' });
    }
    console.error('❌ updateText failed:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Unable to update global text.' });
  }

  await logAuditEvent({
    req,
    actor: actorFromRequest(req),
    action: before.status !== data.status && data.status === 'published' ? 'PUBLISH_GLOBAL_STRING' : 'UPDATE_GLOBAL_STRING',
    resourceType: 'global_string',
    resourceId: data.id,
    beforeState: before,
    afterState: data,
    result: 'SUCCESS',
    severity: 'INFO',
    source: 'texts'
  });

  return res.json({ text: data });
}

export async function deleteText(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Service Unavailable', message: 'Text registry is not configured.' });

  const { data: before, error: fetchError } = await supabase
    .from('zoal_strings')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: 'Internal Server Error', message: 'Unable to load the global text.' });
  if (!before) return res.status(404).json({ error: 'Not Found', message: 'Global text not found.' });

  const { error } = await supabase.from('zoal_strings').delete().eq('id', req.params.id);
  if (error) {
    console.error('❌ deleteText failed:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Unable to delete global text.' });
  }

  await logAuditEvent({
    req,
    actor: actorFromRequest(req),
    action: 'DELETE_GLOBAL_STRING',
    resourceType: 'global_string',
    resourceId: before.id,
    beforeState: before,
    result: 'SUCCESS',
    severity: 'WARN',
    source: 'texts'
  });

  return res.json({ success: true });
}
