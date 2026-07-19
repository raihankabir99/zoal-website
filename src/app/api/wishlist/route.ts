import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * GET /api/wishlist
 * Retrieve active customer's wishlist items.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { data, error } = await supabase
      .from('zoal_wishlist')
      .select('*, zoal_products(*)')
      .eq('user_id', user.id);

    if (error) return apiError(error.message, 500);
    return apiResponse(data);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/wishlist
 * Add or toggle items in customer wishlist.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();
    const validationErr = validateFields(body, ['product_id']);
    if (validationErr) return apiError(validationErr, 400);

    // Check if already in wishlist to toggle
    const { data: existing } = await supabase
      .from('zoal_wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', body.product_id)
      .maybeSingle();

    if (existing) {
      // Toggle off: Delete
      const { error: delErr } = await supabase
        .from('zoal_wishlist')
        .delete()
        .eq('id', existing.id);

      if (delErr) return apiError(delErr.message, 500);
      return apiResponse({ toggled: 'removed', productId: body.product_id });
    } else {
      // Toggle on: Add
      const { data, error } = await supabase
        .from('zoal_wishlist')
        .insert({
          user_id: user.id,
          product_id: body.product_id
        })
        .select()
        .single();

      if (error) return apiError(error.message, 500);
      return apiResponse({ toggled: 'added', wishlistRecord: data }, 201);
    }

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
