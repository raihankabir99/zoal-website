import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * GET /api/orders
 * Returns a list of orders.
 * RBAC: Admins & Staff can see all orders with pagination and status filters.
 * Customers can only see their own orders.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status');

    let query = supabase
      .from('zoal_orders')
      .select('*', { count: 'exact' });

    // RBAC logic constraint: Customers only retrieve their own orders
    if (user.role === 'customer') {
      query = query.eq('customer_id', user.id);
    } else {
      // Staff or Admin filtering by specific customer ID is allowed
      const filterCustomerId = url.searchParams.get('customerId');
      if (filterCustomerId) {
        query = query.eq('customer_id', filterCustomerId);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Sorting
    query = query.order('created_at', { ascending: false });
    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) return apiError(error.message, 500);

    return apiResponse({
      orders,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/orders
 * Creates a new order. (RBAC: authenticated user or customer checkout)
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();
    const validationErr = validateFields(body, ['items', 'subtotal', 'total_amount', 'shipping_address']);
    if (validationErr) return apiError(validationErr, 400);

    // Secure generation of order
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    // Insert order header
    const { data: order, error: orderErr } = await supabase
      .from('zoal_orders')
      .insert({
        id: orderId,
        customer_id: user.id,
        status: 'pending',
        subtotal: body.subtotal,
        discount_amount: body.discount_amount || 0,
        shipping_cost: body.shipping_cost || 0,
        tax_amount: body.tax_amount || 0,
        total_amount: body.total_amount,
        payment_status: 'unpaid',
        payment_method: body.payment_method || 'card',
        notes: body.notes || ''
      })
      .select()
      .single();

    if (orderErr) return apiError(orderErr.message, 500);

    // Insert order items
    const orderItems = body.items.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: itemsErr } = await supabase
      .from('zoal_order_items')
      .insert(orderItems);

    if (itemsErr) {
      // Attempt soft rollback
      await supabase.from('zoal_orders').delete().eq('id', orderId);
      return apiError(`Failed to save order detail components: ${itemsErr.message}`, 500);
    }

    return apiResponse({ order, items: orderItems }, 201);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
