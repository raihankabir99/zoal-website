import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../../helpers';

/**
 * GET /api/warehouses/[id]
 * Fetch single warehouse by ID or warehouse_code.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const { id } = params;
    let query = supabase.from('zoal_warehouses').select('*');

    if (id.length === 36) {
      query = query.eq('id', id);
    } else {
      query = query.eq('warehouse_code', id);
    }

    const { data: warehouse, error } = await query.single();

    if (error || !warehouse) {
      return apiError('Warehouse not found', 404);
    }

    return apiResponse(warehouse);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * PUT /api/warehouses/[id]
 * Update warehouse record in Supabase.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const { id } = params;
    const body = await req.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.warehouse_name !== undefined || body.name !== undefined) {
      updatePayload.warehouse_name = body.warehouse_name || body.name;
    }
    if (body.warehouse_code !== undefined || body.code !== undefined) {
      updatePayload.warehouse_code = body.warehouse_code || body.code;
    }
    if (body.country !== undefined) updatePayload.country = body.country;
    if (body.city !== undefined) updatePayload.city = body.city;
    if (body.address !== undefined) updatePayload.address = body.address;
    if (body.manager !== undefined) updatePayload.manager = body.manager;
    if (body.phone !== undefined) updatePayload.phone = body.phone;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.capacity !== undefined) updatePayload.capacity = parseInt(body.capacity, 10);
    if (body.used_capacity !== undefined) updatePayload.used_capacity = parseInt(body.used_capacity, 10);
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.latitude !== undefined) updatePayload.latitude = parseFloat(body.latitude);
    if (body.longitude !== undefined) updatePayload.longitude = parseFloat(body.longitude);

    const { data: updated, error } = await supabase
      .from('zoal_warehouses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(updated);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  return PUT(req, context);
}

/**
 * DELETE /api/warehouses/[id]
 * Delete warehouse from Supabase.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const { id } = params;
    const { error } = await supabase
      .from('zoal_warehouses')
      .delete()
      .eq('id', id);

    if (error) return apiError(error.message, 500);
    return apiResponse({ success: true, deletedId: id });
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
