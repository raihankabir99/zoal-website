import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * GET /api/cart
 * Fetch active shopper's database-synchronized cart.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const { data: items, error } = await supabase
      .from('zoal_cart')
      .select('*, zoal_products(*)')
      .eq('user_id', user.id);

    if (error) return apiError(error.message, 500);
    return apiResponse(items);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/cart
 * Update or insert cart item quantities.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();
    const validationErr = validateFields(body, ['product_id', 'quantity']);
    if (validationErr) return apiError(validationErr, 400);

    const qty = parseInt(body.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return apiError('Quantity must be an integer >= 1', 400);
    }

    // Upsert logic for cart item
    const { data, error } = await supabase
      .from('zoal_cart')
      .upsert({
        user_id: user.id,
        product_id: body.product_id,
        quantity: qty,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,product_id'
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(data);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * DELETE /api/cart
 * Clear or delete specific cart item.
 */
export async function DELETE(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');

    let query = supabase
      .from('zoal_cart')
      .delete()
      .eq('user_id', user.id);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { error } = await query;
    if (error) return apiError(error.message, 500);

    return apiResponse({ message: productId ? 'Cart item successfully deleted' : 'Entire cart successfully cleared' });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
