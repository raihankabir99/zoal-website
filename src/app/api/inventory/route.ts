import { NextRequest } from 'next/server';
import { apiError, apiResponse, checkRateLimit, verifyAuthAndRole } from '../helpers';
import { getServiceSupabaseClient } from '../../../../server/supabase';

const INVENTORY_ROLES = ['owner', 'admin', 'manager', 'staff'] as const;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value);
  return null;
}

/**
 * Inventory is authoritative in zoal_inventory. This route deliberately does
 * not write zoal_products.inventory, preventing the legacy dual-source drift.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, INVENTORY_ROLES as any);
  if (auth.error) return auth.error;

  const client = getServiceSupabaseClient();
  if (!client) return apiError('Inventory service is not configured', 503);

  try {
    const productId = req.nextUrl.searchParams.get('productId');
    const warehouseId = req.nextUrl.searchParams.get('warehouseId');
    let query = client
      .from('zoal_inventory')
      .select('id, product_id, warehouse_id, quantity, reserved_quantity, min_stock, max_stock, low_stock_threshold, warehouse_location, updated_at')
      .order('updated_at', { ascending: false });

    if (productId) query = query.eq('product_id', productId);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);

    const { data, error } = await query;
    if (error) return apiError(error.message, 500);
    return apiResponse(data || []);
  } catch (error: any) {
    return apiError(error?.message || 'Inventory service error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, INVENTORY_ROLES as any);
  if (auth.error) return auth.error;

  const client = getServiceSupabaseClient();
  if (!client) return apiError('Inventory service is not configured', 503);

  try {
    const body = await req.json();
    const productId = typeof body?.productId === 'string' ? body.productId : '';
    const quantityChange = toInteger(body?.quantityChange);
    const operation = body?.operation;

    if (!productId || !isUuid(productId)) return apiError('A valid productId is required', 400);
    if (operation !== 'adjust') return apiError('Unsupported inventory operation', 400);
    if (quantityChange === null || quantityChange === 0) return apiError('quantityChange must be a non-zero integer', 400);

    let query = client
      .from('zoal_inventory')
      .select('id, product_id, warehouse_id, quantity, reserved_quantity, min_stock, max_stock, low_stock_threshold')
      .eq('product_id', productId);

    if (isUuid(body?.warehouseId)) {
      query = query.eq('warehouse_id', body.warehouseId);
    }

    const { data: rows, error: readError } = await query.order('updated_at', { ascending: false }).limit(1);
    if (readError) return apiError(readError.message, 500);
    const row = rows?.[0];
    if (!row) return apiError('Inventory record not found for this product/warehouse', 404);

    const nextQuantity = row.quantity + quantityChange;
    if (nextQuantity < 0) return apiError('Inventory quantity cannot become negative', 409);
    if (row.max_stock !== null && nextQuantity > row.max_stock) {
      return apiError(`Inventory quantity cannot exceed max_stock (${row.max_stock})`, 409);
    }
    if (nextQuantity < row.reserved_quantity) {
      return apiError(`Inventory quantity cannot be below reserved quantity (${row.reserved_quantity})`, 409);
    }

    const { data, error } = await client
      .from('zoal_inventory')
      .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .select('id, product_id, warehouse_id, quantity, reserved_quantity, min_stock, max_stock, low_stock_threshold, updated_at')
      .single();

    if (error) return apiError(error.message, 500);

    return apiResponse({
      inventory: data,
      previousQuantity: row.quantity,
      quantityChange,
      operator: auth.user?.id || null,
      reason: typeof body?.reason === 'string' ? body.reason.slice(0, 500) : null,
      referenceId: typeof body?.referenceId === 'string' ? body.referenceId.slice(0, 200) : null,
      batchNumber: typeof body?.batchNumber === 'string' ? body.batchNumber.slice(0, 200) : null
    });
  } catch (error: any) {
    return apiError(error?.message || 'Inventory update failed', 500);
  }
}