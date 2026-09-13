import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://jglveforpqhioxpambbq.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';
const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager', 'staff']);
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

function supabaseUrl() { return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, ''); }
function serviceKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''; }
function client() { return createClient(supabaseUrl(), serviceKey(), { auth: { autoRefreshToken: false, persistSession: false } }); }
function requestIp(req: any) { const value = req.headers?.['x-forwarded-for']; return typeof value === 'string' ? value.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown'; }
function limited(req: any, res: any) { const key = requestIp(req); const now = Date.now(); let entry = rateLimitCache.get(key); if (!entry || now >= entry.resetTime) entry = { count: 0, resetTime: now + RATE_WINDOW_MS }; entry.count += 1; rateLimitCache.set(key, entry); res.setHeader('X-RateLimit-Limit', RATE_LIMIT); res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - entry.count)); return entry.count <= RATE_LIMIT; }

async function authenticate(req: any, adminClient: any) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return { status: 401, message: 'Authentication required.' };
  const token = authHeader.slice(7).trim();
  if (!token) return { status: 401, message: 'Authentication required.' };
  const response = await fetch(`${supabaseUrl()}/auth/v1/user`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) return { status: 401, message: 'Session expired or invalid token.' };
  const user = await response.json();
  if (!user?.id) return { status: 401, message: 'Invalid authenticated user.' };
  const { data: profile, error } = await adminClient.from('zoal_users').select('role,email').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!profile?.role || !ALLOWED_ROLES.has(profile.role)) return { status: 403, message: 'Insufficient inventory permission.' };
  return { user, role: profile.role, email: profile.email || user.email || '' };
}
function cleanNonNegativeInteger(value: any, field: string) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed < 0) throw Object.assign(new Error(`${field} must be a non-negative integer.`), { status: 400 }); return parsed; }
async function resolveWarehouseId(adminClient: any, requested: any) {
  if (requested) {
    const value = String(requested).trim();
    const byId = await adminClient.from('zoal_warehouses').select('id').eq('id', value).maybeSingle(); if (byId.data?.id) return byId.data.id;
    const byCode = await adminClient.from('zoal_warehouses').select('id').eq('warehouse_code', value).maybeSingle(); if (byCode.data?.id) return byCode.data.id;
    const byName = await adminClient.from('zoal_warehouses').select('id').ilike('warehouse_name', value).maybeSingle(); if (byName.data?.id) return byName.data.id;
    throw Object.assign(new Error('Warehouse not found.'), { status: 404 });
  }
  const { data, error } = await adminClient.from('zoal_warehouses').select('id').eq('status', 'Active').order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (error) throw error; if (!data?.id) throw Object.assign(new Error('No active warehouse is configured.'), { status: 409 }); return data.id;
}

export default async function handler(req: any, res: any) {
  if (!limited(req, res)) return res.status(429).json({ error: 'Too Many Requests' });
  const key = serviceKey(); if (!key) return res.status(503).json({ error: 'Inventory database is unavailable.' });
  const adminClient = client();
  try {
    const auth = await authenticate(req, adminClient); if (auth.status) return res.status(auth.status).json({ error: auth.message });
    if (req.method === 'GET') {
      if (String(req.query?.view || '').toLowerCase() === 'logs') {
        const limit = Math.min(Math.max(Number(req.query?.limit) || 100, 1), 250);
        const { data, error } = await adminClient.from('zoal_activity_logs').select('id,user_id,email,action,timestamp,resource_id,before_state,after_state,changed_fields,metadata,result,severity,source').eq('resource_type', 'inventory').order('timestamp', { ascending: false }).limit(limit);
        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      }
      const { data, error } = await adminClient.from('zoal_inventory').select('id,product_id,quantity,reserved_quantity,min_stock,max_stock,low_stock_threshold,warehouse_id,warehouse_location,updated_at').order('updated_at', { ascending: false });
      if (error) throw error; return res.status(200).json({ success: true, data: data || [] });
    }
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method Not Allowed' });
    const body = req.body || {}; const productId = String(body.productId || body.product_id || '').trim(); if (!productId) return res.status(400).json({ error: 'productId is required.' });
    const warehouseId = await resolveWarehouseId(adminClient, body.warehouseId || body.warehouse_id || body.warehouse);
    const { data: current, error: readError } = await adminClient.from('zoal_inventory').select('*').eq('product_id', productId).eq('warehouse_id', warehouseId).maybeSingle();
    if (readError) throw readError; if (!current) return res.status(404).json({ error: 'Inventory row not found for product and warehouse.' });
    const before = { ...current }; const operation = body.operation || 'set'; let nextQuantity = Number(current.quantity);
    if (operation === 'adjust') { const delta = Number(body.quantityChange ?? body.delta); if (!Number.isInteger(delta)) return res.status(400).json({ error: 'quantityChange must be an integer.' }); nextQuantity += delta; }
    else if (operation === 'set') nextQuantity = cleanNonNegativeInteger(body.quantity, 'quantity');
    else return res.status(400).json({ error: 'Unsupported inventory operation.' });
    if (nextQuantity < 0) return res.status(409).json({ error: 'Inventory cannot become negative.' });
    if (current.max_stock !== null && nextQuantity > Number(current.max_stock)) return res.status(409).json({ error: `Inventory cannot exceed max_stock (${current.max_stock}).` });
    if (Number(current.reserved_quantity) > nextQuantity) return res.status(409).json({ error: 'Inventory cannot be set below reserved quantity.' });
    const updatePayload: Record<string, any> = { quantity: nextQuantity, updated_at: new Date().toISOString() };
    if (body.minStock !== undefined || body.min_stock !== undefined) updatePayload.min_stock = cleanNonNegativeInteger(body.minStock ?? body.min_stock, 'minStock');
    if (body.maxStock !== undefined || body.max_stock !== undefined) updatePayload.max_stock = body.maxStock === null || body.max_stock === null ? null : cleanNonNegativeInteger(body.maxStock ?? body.max_stock, 'maxStock');
    if (body.lowStockThreshold !== undefined || body.low_stock_threshold !== undefined) updatePayload.low_stock_threshold = cleanNonNegativeInteger(body.lowStockThreshold ?? body.low_stock_threshold, 'lowStockThreshold');
    if (updatePayload.max_stock !== undefined && updatePayload.max_stock !== null && Number(updatePayload.max_stock) < nextQuantity) return res.status(409).json({ error: 'maxStock cannot be below current quantity.' });
    if (updatePayload.min_stock !== undefined && Number(updatePayload.min_stock) > nextQuantity) return res.status(409).json({ error: 'minStock cannot exceed current quantity.' });
    const { data: updated, error: updateError } = await adminClient.from('zoal_inventory').update(updatePayload).eq('id', current.id).select('*').single(); if (updateError) throw updateError;
    const { error: logError } = await adminClient.from('zoal_activity_logs').insert({ id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, user_id: auth.user.id, email: auth.email, action: `INVENTORY_${operation.toUpperCase()}`, timestamp: new Date().toISOString(), ip: requestIp(req), user_agent: req.headers?.['user-agent'] || 'inventory-api', resource_type: 'inventory', resource_id: current.id, before_state: before, after_state: updated, changed_fields: Object.keys(updatePayload), metadata: { product_id: productId, warehouse_id: warehouseId, reason: body.reason || null, reference_id: body.referenceId || null, batch_number: body.batchNumber || null }, result: 'success', severity: 'info', source: 'inventory' });
    if (logError) console.error('Inventory audit log error:', logError);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) { const status = Number(error?.status) || 500; console.error('Inventory API error:', error); return res.status(status).json({ error: status >= 500 ? 'Inventory server error.' : error.message }); }
}
