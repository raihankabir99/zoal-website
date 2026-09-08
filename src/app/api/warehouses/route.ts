import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, apiResponse, apiError } from '../helpers';

const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager', 'staff']);
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

function adminClient() {
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authenticate(req: NextRequest, client: ReturnType<typeof adminClient>) {
  if (!serviceKey || !supabaseUrl) return { error: apiError('Warehouse database is unavailable.', 503) };
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return { error: apiError('Authentication token is required', 401) };
  const token = header.slice(7).trim();
  if (!token) return { error: apiError('Authentication token is required', 401) };
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '', Authorization: `Bearer ${token}` } });
  if (!response.ok) return { error: apiError('Invalid or expired authentication token', 401) };
  const authUser = await response.json();
  if (!authUser?.id) return { error: apiError('Invalid authenticated user', 401) };
  const { data: profile, error } = await client.from('zoal_users').select('id,email,role').eq('id', authUser.id).maybeSingle();
  if (error) throw error;
  if (!profile?.role || !ALLOWED_ROLES.has(profile.role)) return { error: apiError('Forbidden: insufficient warehouse privileges', 403) };
  return { user: profile };
}

function parseNonNegativeInteger(value: unknown, field: string, fallback: number | null = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw Object.assign(new Error(`${field} must be a non-negative integer.`), { status: 400 });
  return parsed;
}

export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const client = adminClient();
    const auth = await authenticate(req, client);
    if (auth.error) return auth.error;
    const { data: warehouses, error } = await client.from('zoal_warehouses').select('*').order('created_at', { ascending: true });
    if (error) return apiError(error.message, 500);
    const { data: inventory } = await client.from('zoal_inventory').select('warehouse_id,quantity');
    const stockByWarehouse: Record<string, number> = {};
    for (const row of inventory || []) {
      if (!row.warehouse_id) continue;
      stockByWarehouse[row.warehouse_id] = (stockByWarehouse[row.warehouse_id] || 0) + (Number(row.quantity) || 0);
    }
    const enriched = (warehouses || []).map((warehouse: any) => {
      const capacity = Number(warehouse.capacity);
      const used = Number(warehouse.used_capacity);
      const activeStockUnits = stockByWarehouse[warehouse.id] ?? 0;
      const utilizationPct = Number.isFinite(capacity) && capacity > 0 ? Math.round((Math.max(0, used) / capacity) * 100) : 0;
      return { ...warehouse, utilizationPct, activeStockUnits };
    });
    return apiResponse(enriched);
  } catch (err: any) {
    return apiError(err?.status ? err.message : 'Warehouse server error.', err?.status || 500);
  }
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const client = adminClient();
    const auth = await authenticate(req, client);
    if (auth.error) return auth.error;
    const body = await req.json();
    const name = String(body?.warehouse_name || body?.name || '').trim();
    const code = String(body?.warehouse_code || body?.code || '').trim();
    if (!name) return apiError('Missing required field: warehouse_name', 400);
    if (!code) return apiError('Missing required field: warehouse_code', 400);
    const capacity = parseNonNegativeInteger(body.capacity, 'capacity');
    const usedCapacity = parseNonNegativeInteger(body.used_capacity, 'used_capacity', 0);
    if (capacity !== null && usedCapacity !== null && usedCapacity > capacity) return apiError('used_capacity cannot exceed capacity', 400);
    const payload = {
      warehouse_name: name,
      warehouse_code: code,
      country: body.country ?? null,
      city: body.city ?? null,
      address: body.address ?? null,
      manager: body.manager ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      capacity,
      used_capacity: usedCapacity,
      status: body.status ?? 'Active',
      latitude: body.latitude === undefined || body.latitude === '' ? null : Number(body.latitude),
      longitude: body.longitude === undefined || body.longitude === '' ? null : Number(body.longitude),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await client.from('zoal_warehouses').insert(payload).select().single();
    if (error) return apiError(error.message, 500);
    return apiResponse(data, 201);
  } catch (err: any) {
    return apiError(err?.status ? err.message : 'Warehouse server error.', err?.status || 500);
  }
}
