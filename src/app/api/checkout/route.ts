import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * POST /api/checkout
 * Validates cart total, computes tax/shipping, and applies coupons.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();
    const validationErr = validateFields(body, ['items', 'shippingMethodId']);
    if (validationErr) return apiError(validationErr, 400);

    const items = body.items || [];
    let subtotal = 0;

    for (const item of items) {
      const { data: prod } = await supabase
        .from('zoal_products')
        .select('price, sale_price')
        .eq('id', item.product_id)
        .single();

      const activePrice = prod ? (prod.sale_price || prod.price) : 0;
      subtotal += activePrice * item.quantity;
    }

    let shippingCost = 0;
    const { data: shipping } = await supabase
      .from('zoal_shipping')
      .select('cost')
      .eq('id', body.shippingMethodId)
      .single();

    if (shipping) {
      shippingCost = Number(shipping.cost);
    }

    let discountAmount = 0;
    let couponId = null;
    if (body.couponCode) {
      const normalizedCouponCode = String(body.couponCode).trim().toUpperCase();
      const { data: coupon } = await supabase
        .from('zoal_coupons')
        .select('*')
        .ilike('code', normalizedCouponCode)
        .eq('is_active', true)
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        const start = coupon.start_date ? new Date(coupon.start_date) : null;
        const end = coupon.expiration_date ? new Date(coupon.expiration_date) : null;

        const isDateValid = (!start || now >= start) && (!end || now <= end);
        const isAmountValid = subtotal >= Number(coupon.min_order_amount || 0);
        const isUsageAvailable = coupon.usage_limit === null || coupon.usage_limit === undefined
          || Number(coupon.usage_count || 0) < Number(coupon.usage_limit);

        if (isDateValid && isAmountValid && isUsageAvailable) {
          couponId = coupon.id;
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
            if (coupon.max_discount_amount) {
              discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
            }
          } else {
            discountAmount = Number(coupon.discount_value);
          }
          discountAmount = Math.min(Math.max(0, discountAmount), subtotal);
        } else if (!isUsageAvailable) {
          return apiError('Coupon usage limit has been reached', 400);
        } else if (!isDateValid) {
          return apiError('Coupon is invalid or expired', 400);
        } else {
          return apiError('Minimum order amount for this coupon has not been reached', 400);
        }
      } else {
        return apiError('Coupon is invalid or inactive', 400);
      }
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
      return apiError('Tax configuration is not available. Checkout is temporarily unavailable until an active tax rate is configured.', 503);
    }

    const ratePercentage = Number(activeTaxRate.rate_percentage);
    const taxAmount = activeTaxRate.tax_type === 'Exempt' || activeTaxRate.tax_type === 'Zero Rated'
      ? 0
      : Number((taxableAmount * ratePercentage / 100).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount + shippingCost).toFixed(2));

    return apiResponse({
      subtotal,
      discountAmount,
      shippingCost,
      taxAmount,
      totalAmount,
      couponId,
      customerId: user.id,
      tax: {
        id: activeTaxRate.id,
        name: activeTaxRate.name,
        type: activeTaxRate.tax_type,
        ratePercentage
      }
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
