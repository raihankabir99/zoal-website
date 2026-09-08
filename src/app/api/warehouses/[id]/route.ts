import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, apiResponse, apiError } from '../../helpers';

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

function parseNonNegativeInteger(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw Object.assign(new Error(`${field} must be a non-negative integer.`), { status: 400 });
  return parsed;
}

async function resolveWarehouse(client: ReturnType<typeof adminClient>, id: string) {
  const query = id.length === 36
    ? client.from('zoal_warehouses').select('*').eq('id', id)
    : client.from('zoal_warehouses').select('*').eq('warehouse_code', id);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const client = adminClient();
    const auth = await authenticate(req, client);
    if (auth.error) return auth.error;
    const warehouse = await resolveWarehouse(client, params.id);
    if (!warehouse) return apiError('Warehouse not found', 404);
    return apiResponse(warehouse);
  } catch (err: any) {
    return apiError(err?.status ? err.message : 'Warehouse server error.', err?.status || 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const client = adminClient();
    const auth = await authenticate(req, client);
    if (auth.error) return auth.error;
    const existing = await resolveWarehouse(client, params.id);
    if (!existing) return apiError('Warehouse not found', 404);
    const body = await req.json();
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.warehouse_name !== undefined || body.name !== undefined) updatePayload.warehouse_name = String(body.warehouse_name ?? body.name).trim();
    if (body.warehouse_code !== undefined || body.code !== undefined) updatePayload.warehouse_code = String(body.warehouse_code ?? body.code).trim();
    if (body.country !== undefined) updatePayload.country = body.country;
    if (body.city !== undefined) updatePayload.city = body.city;
    if (body.address !== undefined) updatePayload.address = body.address;
    if (body.manager !== undefined) updatePayload.manager = body.manager;
    if (body.phone !== undefined) updatePayload.phone = body.phone;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.capacity !== undefined) updatePayload.capacity = parseNonNegativeInteger(body.capacity, 'capacity');
    if (body.used_capacity !== undefined) updatePayload.used_capacity = parseNonNegativeInteger(body.used_capacity, 'used_capacity');
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.latitude !== undefined) updatePayload.latitude = body.latitude === null || body.latitude === '' ? null : Number(body.latitude);
    if (body.longitude !== undefined) updatePayload.longitude = body.longitude === null || body.longitude === '' ? null : Number(body.longitude);
    const finalCapacity = updatePayload.capacity ?? existing.capacity;
    const finalUsed = updatePayload.used_capacity ?? existing.used_capacity ?? 0;
    if (finalCapacity !== null && Number(finalUsed) > Number(finalCapacity)) return apiError('used_capacity cannot exceed capacity', 400);
    const { data: updated, error } = await client.from('zoal_warehouses').update(updatePayload).eq('id', existing.id).select().single();
    if (error) return apiError(error.message, 500);
    return apiResponse(updated);
  } catch (err: any) {
    return apiError(err?.status ? err.message : 'Warehouse server error.', err?.status || 500);
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  return PUT(req, context);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const client = adminClient();
    const auth = await authenticate(req, client);
    if (auth.error) return auth.error;
    const existing = await resolveWarehouse(client, params.id);
    if (!existing) return apiError('Warehouse not found', 404);
    const { error } = await client.from('zoal_warehouses').delete().eq('id', existing.id);
    if (error) return apiError(error.message, 500);
    return apiResponse({ success: true, deletedId: existing.id });
  } catch (err: any) {
    return apiError(err?.status ? err.message : 'Warehouse server error.', err?.status || 500);
  }
}
