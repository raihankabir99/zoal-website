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

/**
 * Creates an order from authoritative server-side pricing.
 * Coupon redemption is reserved through an atomic database RPC so concurrent
 * requests cannot exceed usage limits.
 */
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
    let appliedCoupon: { id: string; code: string } | null = null;
    const requestedCouponCode = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : '';

    if (requestedCouponCode) {
      const { data: coupon, error: couponErr } = await supabase
        .from('zoal_coupons')
        .select('*')
        .ilike('code', requestedCouponCode)
        .eq('is_active', true)
        .maybeSingle();

      if (couponErr) return apiError(couponErr.message, 500);
      if (!coupon) return apiError('Coupon is invalid or inactive', 400);

      const now = new Date();
      const start = coupon.start_date ? new Date(coupon.start_date) : null;
      const end = coupon.expiration_date ? new Date(coupon.expiration_date) : null;
      const usageAvailable = coupon.usage_limit === null || coupon.usage_limit === undefined
        || Number(coupon.usage_count || 0) < Number(coupon.usage_limit);

      if (start && now < start) return apiError('Coupon is not active yet', 400);
      if (end && now > end) return apiError('Coupon has expired', 400);
      if (!usageAvailable) return apiError('Coupon usage limit has been reached', 400);
      if (subtotal < Number(coupon.min_order_amount || 0)) return apiError('Minimum order amount for this coupon has not been reached', 400);

      if (coupon.discount_type === 'percentage') {
        discountAmount = subtotal * Number(coupon.discount_value) / 100;
        if (coupon.max_discount_amount) discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
      } else {
        discountAmount = Number(coupon.discount_value);
      }

      discountAmount = Math.min(Math.max(0, discountAmount), subtotal);
      appliedCoupon = { id: coupon.id, code: coupon.code };
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * 0.15).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount + shippingCost).toFixed(2));
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const { data: order, error: orderErr } = await supabase.from('zoal_orders').insert({
      id: orderId,
      customer_id: user.id,
      status: 'pending',
      coupon_id: appliedCoupon?.id || null,
      subtotal,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_status: 'unpaid',
      payment_method: body.payment_method || 'card',
      notes: body.notes || ''
    }).select().single();

    if (orderErr) return apiError(orderErr.message, 500);

    if (appliedCoupon) {
      const { error: redemptionErr } = await supabase.rpc('redeem_coupon_for_order', {
        p_coupon_id: appliedCoupon.id,
        p_order_id: orderId,
        p_customer_id: user.id,
        p_discount_amount: discountAmount
      });

      if (redemptionErr) {
        await supabase.from('zoal_orders').delete().eq('id', orderId);
        return apiError(
          redemptionErr.message?.includes('COUPON_REDEMPTION_NOT_AVAILABLE')
            ? 'Coupon usage limit has been reached'
            : `Failed to redeem coupon: ${redemptionErr.message}`,
          400
        );
      }
    }

    const orderItems = validatedItems.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      total_price: item.total_price
    }));

    const { error: itemsErr } = await supabase.from('zoal_order_items').insert(orderItems);
    if (itemsErr) {
      // Cascading redemption deletion triggers usage_count rollback.
      await supabase.from('zoal_orders').delete().eq('id', orderId);
      return apiError(`Failed to save order detail components: ${itemsErr.message}`, 500);
    }

    return apiResponse({
      order,
      items: orderItems,
      coupon: appliedCoupon ? { id: appliedCoupon.id, code: appliedCoupon.code, discountAmount } : null,
      totals: { subtotal, discountAmount, shippingCost, taxAmount, totalAmount }
    }, 201);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
