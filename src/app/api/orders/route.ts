import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

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
    let query = supabase.from('zoal_orders').select('*', { count: 'exact' });
    if (user.role === 'customer') query = query.eq('customer_id', user.id);
    else {
      const filterCustomerId = url.searchParams.get('customerId');
      if (filterCustomerId) query = query.eq('customer_id', filterCustomerId);
    }
    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data: orders, error, count } = await query;
    if (error) return apiError(error.message, 500);
    return apiResponse({ orders, pagination: { page, limit, totalItems: count || 0, totalPages: Math.ceil((count || 0) / limit) } });
  } catch (err: any) { return apiError(err.message || 'Server error', 500); }
}

/** Creates an order and snapshots authoritative product cost for future COGS. */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;
    const body = await req.json();
    const validationErr = validateFields(body, ['items', 'shipping_address']);
    if (validationErr) return apiError(validationErr, 400);
    const items = body.items || [];
    if (!Array.isArray(items) || items.length === 0) return apiError('Order items must not be empty', 400);

    let subtotal = 0;
    const validatedItems: Array<{ product_id: string; quantity: number; unit_price: number; unit_cost: number | null; total_price: number }> = [];

    for (const item of items) {
      const pId = item.product_id || item.productId || item.id;
      const { data: prod, error: productErr } = await supabase.from('zoal_products').select('price, sale_price, cost_price').eq('id', pId).maybeSingle();
      if (productErr) return apiError(productErr.message, 500);
      if (!prod) return apiError(`Product not found: ${pId}`, 400);

      const unitPrice = Number(prod.sale_price ?? prod.price);
      const unitCost = prod.cost_price === null || prod.cost_price === undefined ? null : Number(prod.cost_price);
      const qty = Math.max(1, parseInt(item.quantity || '1', 10));
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return apiError(`Invalid product price for ${pId}`, 400);
      if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) return apiError(`Invalid product cost for ${pId}`, 400);

      subtotal += unitPrice * qty;
      validatedItems.push({ product_id: pId, quantity: qty, unit_price: unitPrice, unit_cost: unitCost, total_price: unitPrice * qty });
    }

    let shippingCost = 0;
    if (body.shippingMethodId) {
      const { data: shipping } = await supabase.from('zoal_shipping').select('cost').eq('id', body.shippingMethodId).maybeSingle();
      if (shipping) shippingCost = Number(shipping.cost);
    } else shippingCost = subtotal >= 500 ? 0 : 35;

    let discountAmount = 0;
    if (body.couponCode) {
      const { data: coupon } = await supabase.from('zoal_coupons').select('*').ilike('code', String(body.couponCode).trim()).eq('is_active', true).maybeSingle();
      if (coupon) {
        const now = new Date();
        const start = coupon.start_date ? new Date(coupon.start_date) : null;
        const end = coupon.expiration_date ? new Date(coupon.expiration_date) : null;
        if ((!start || now >= start) && (!end || now <= end) && subtotal >= Number(coupon.min_order_amount || 0)) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = subtotal * Number(coupon.discount_value) / 100;
            if (coupon.max_discount_amount) discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
          } else discountAmount = Number(coupon.discount_value);
          discountAmount = Math.min(discountAmount, subtotal);
        }
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * 0.15).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount + shippingCost).toFixed(2));
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const { data: order, error: orderErr } = await supabase.from('zoal_orders').insert({
      id: orderId, customer_id: user.id, status: 'pending', subtotal, discount_amount: discountAmount,
      shipping_cost: shippingCost, tax_amount: taxAmount, total_amount: totalAmount,
      payment_status: 'unpaid', payment_method: body.payment_method || 'card', notes: body.notes || ''
    }).select().single();
    if (orderErr) return apiError(orderErr.message, 500);

    const orderItems = validatedItems.map(item => ({
      order_id: orderId, product_id: item.product_id, quantity: item.quantity,
      unit_price: item.unit_price, unit_cost: item.unit_cost, total_price: item.total_price
    }));
    const { error: itemsErr } = await supabase.from('zoal_order_items').insert(orderItems);
    if (itemsErr) {
      await supabase.from('zoal_orders').delete().eq('id', orderId);
      return apiError(`Failed to save order detail components: ${itemsErr.message}`, 500);
    }
    return apiResponse({ order, items: orderItems, totals: { subtotal, discountAmount, shippingCost, taxAmount, totalAmount } }, 201);
  } catch (err: any) { return apiError(err.message || 'Server error', 500); }
}
