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

    // Calculate subtotal from products in database to ensure safety
    for (const item of items) {
      const { data: prod } = await supabase
        .from('zoal_products')
        .select('price, sale_price')
        .eq('id', item.product_id)
        .single();

      const activePrice = prod ? (prod.sale_price || prod.price) : 0;
      subtotal += activePrice * item.quantity;
    }

    // Apply Shipping Cost
    let shippingCost = 0;
    const { data: shipping } = await supabase
      .from('zoal_shipping')
      .select('cost')
      .eq('id', body.shippingMethodId)
      .single();

    if (shipping) {
      shippingCost = Number(shipping.cost);
    }

    // Apply Coupon Code
    let discountAmount = 0;
    let couponId = null;
    if (body.couponCode) {
      const { data: coupon } = await supabase
        .from('zoal_coupons')
        .select('*')
        .eq('code', body.couponCode)
        .eq('is_active', true)
        .single();

      if (coupon) {
        const now = new Date();
        const start = coupon.start_date ? new Date(coupon.start_date) : null;
        const end = coupon.expiration_date ? new Date(coupon.expiration_date) : null;

        const isDateValid = (!start || now >= start) && (!end || now <= end);
        const isAmountValid = subtotal >= Number(coupon.min_order_amount);

        if (isDateValid && isAmountValid) {
          couponId = coupon.id;
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
            if (coupon.max_discount_amount) {
              discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
            }
          } else {
            discountAmount = Number(coupon.discount_value);
          }
          discountAmount = Math.min(discountAmount, subtotal); // can't exceed subtotal
        }
      }
    }

    // Tax calculation (15% Saudi VAT standard)
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Number((taxableAmount * 0.15).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount + shippingCost).toFixed(2));

    return apiResponse({
      subtotal,
      discountAmount,
      shippingCost,
      taxAmount,
      totalAmount,
      couponId,
      customerId: user.id
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
