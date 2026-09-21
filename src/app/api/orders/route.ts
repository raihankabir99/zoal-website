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

    let enrichedOrders = orders || [];
    if (enrichedOrders.length > 0) {
      const orderIds = enrichedOrders.map((order: any) => order.id);
      const { data: items, error: itemsError } = await supabase
        .from('zoal_order_items')
        .select('order_id, product_id, quantity, unit_price, total_price')
        .in('order_id', orderIds);
      if (itemsError) return apiError(itemsError.message, 500);

      const itemsByOrder = new Map<string, any[]>();
      for (const item of items || []) {
        const list = itemsByOrder.get(String(item.order_id)) || [];
        list.push(item);
        itemsByOrder.set(String(item.order_id), list);
      }
      enrichedOrders = enrichedOrders.map((order: any) => ({
        ...order,
        items: itemsByOrder.get(String(order.id)) || [],
      }));
    }

    return apiResponse({ orders: enrichedOrders, pagination: { page, limit, totalItems: count || 0, totalPages: Math.ceil((count || 0) / limit) } });
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
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
        return apiError(`Invalid quantity for ${pId}. Quantity must be an integer between 1 and 1000.`, 400);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return apiError(`Invalid product price for ${pId}`, 400);
      if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) return apiError(`Invalid product cost for ${pId}`, 400);

      subtotal += unitPrice * qty;
      validatedItems.push({ product_id: pId, quantity: qty, unit_price: unitPrice, unit_cost: unitCost, total_price: unitPrice * qty });
    }

    let shippingCost = 0;
    if (body.shippingMethodId) {
      const { data: shipping, error: shippingErr } = await supabase
        .from('zoal_shipping')
        .select('cost, is_active')
        .eq('id', body.shippingMethodId)
        .maybeSingle();
      if (shippingErr) return apiError(shippingErr.message, 500);
      if (!shipping || shipping.is_active !== true) {
        return apiError('Selected shipping method is unavailable.', 400);
      }
      shippingCost = Number(shipping.cost);
      if (!Number.isFinite(shippingCost) || shippingCost < 0) {
        return apiError('Invalid shipping configuration.', 500);
      }
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
    const now = new Date().toISOString();
    const { data: activeTaxRate, error: taxRateError } = await supabase
      .from('zoal_tax_rates')
      .select('id, name, rate_percentage, tax_type, start_date, end_date, is_active')
      .eq('is_active', true)
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (taxRateError) return apiError(`Unable to resolve tax configuration: ${taxRateError.message}`, 500);
    if (!activeTaxRate) {
      return apiError('Tax configuration is not available. Order creation is temporarily unavailable until an active tax rate is configured.', 503);
    }

    const ratePercentage = Number(activeTaxRate.rate_percentage);
    if (!Number.isFinite(ratePercentage) || ratePercentage < 0 || ratePercentage > 100) {
      return apiError('Invalid tax configuration.', 500);
    }

    const taxAmount = activeTaxRate.tax_type === 'Exempt' || activeTaxRate.tax_type === 'Zero Rated'
      ? 0
      : Number((taxableAmount * ratePercentage / 100).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount + shippingCost).toFixed(2));
    const orderId = 'ORD-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();

    const { data: atomicResult, error: atomicError } = await serviceSupabase.rpc('create_order_atomic', {
      p_order_id: orderId,
      p_customer_id: user.id,
      p_items: validatedItems,
      p_subtotal: subtotal,
      p_discount_amount: discountAmount,
      p_shipping_cost: shippingCost,
      p_tax_amount: taxAmount,
      p_total_amount: totalAmount,
      p_coupon_id: appliedCoupon?.id || null,
      p_coupon_code: appliedCoupon?.code || null,
      p_coupon_discount: discountAmount,
      p_payment_method: body.payment_method || 'card',
      p_notes: body.notes || '',
      p_order_data: { ...(body.order_data || {}), shipping_address: body.shipping_address }
    });

    if (atomicError) {
      const message = atomicError.message || '';
      if (message.includes('INSUFFICIENT_INVENTORY')) {
        return apiError('One or more products are out of stock or do not have enough available stock.', 409);
      }
      if (message.includes('COUPON_REDEMPTION_NOT_AVAILABLE')) {
        return apiError('Coupon usage limit has been reached.', 409);
      }
      return apiError(message || 'Unable to create order.', 500);
    }

    const order = atomicResult?.order || null;
    const orderItems = validatedItems.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      total_price: item.total_price
    }));

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
