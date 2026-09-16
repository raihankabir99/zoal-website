import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * GET /api/reviews
 * Fetch product reviews with filtering, approved filter, sorting.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    const mine = url.searchParams.get('mine') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('zoal_reviews')
      .select('*, zoal_users(first_name, last_name)', { count: 'exact' });

    if (mine) {
      const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
      if (auth.error) return auth.error;
      query = query.eq('user_id', auth.user!.id);
    } else {
      if (productId) query = query.eq('product_id', productId);
      query = query.eq('is_approved', true);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;
    if (error) return apiError(error.message, 500);

    return apiResponse({
      reviews,
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
 * PUT /api/reviews
 * Update an authenticated customer's own review.
 */
export async function PUT(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();
    const validationErr = validateFields(body, ['review_id', 'product_id', 'rating', 'comment']);
    if (validationErr) return apiError(validationErr, 400);

    const rating = parseInt(body.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return apiError('Rating must be an integer between 1 and 5 stars', 400);
    }

    if (user.role === 'customer') {
      const { data: eligibleOrders, error: orderError } = await supabase
        .from('zoal_orders')
        .select('id')
        .eq('customer_id', user.id)
        .in('status', ['delivered', 'completed']);

      if (orderError) return apiError(orderError.message, 500);
      const orderIds = (eligibleOrders || []).map((order: any) => order.id);
      if (orderIds.length === 0) return apiError('Reviews are available only for products from completed purchases.', 403);

      const { data: purchasedItem, error: itemError } = await supabase
        .from('zoal_order_items')
        .select('id')
        .eq('product_id', body.product_id)
        .in('order_id', orderIds)
        .limit(1)
        .maybeSingle();

      if (itemError) return apiError(itemError.message, 500);
      if (!purchasedItem) return apiError('You can review only products from your completed purchases.', 403);
    }

    const { data: review, error } = await supabase
      .from('zoal_reviews')
      .update({
        product_id: body.product_id,
        rating,
        comment: body.comment,
        is_approved: false
      })
      .eq('id', body.review_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(review);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * DELETE /api/reviews
 * Delete an authenticated customer's own review.
 */
export async function DELETE(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const reviewId = new URL(req.url).searchParams.get('review_id');
    if (!reviewId) return apiError("Missing required field: 'review_id'", 400);

    const { error } = await supabase
      .from('zoal_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (error) return apiError(error.message, 500);
    return apiResponse({ deleted: true, reviewId });
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/reviews
 * Submit a review for a product. Customer reviews require a completed purchase.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();
    const validationErr = validateFields(body, ['product_id', 'rating', 'comment']);
    if (validationErr) return apiError(validationErr, 400);

    const rating = parseInt(body.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return apiError('Rating must be an integer between 1 and 5 stars', 400);
    }

    if (user.role === 'customer') {
      const { data: eligibleOrders, error: orderError } = await supabase
        .from('zoal_orders')
        .select('id')
        .eq('customer_id', user.id)
        .in('status', ['delivered', 'completed']);

      if (orderError) return apiError(orderError.message, 500);
      const orderIds = (eligibleOrders || []).map((order: any) => order.id);
      if (orderIds.length === 0) return apiError('Reviews are available only for products from completed purchases.', 403);

      const { data: purchasedItem, error: itemError } = await supabase
        .from('zoal_order_items')
        .select('id')
        .eq('product_id', body.product_id)
        .in('order_id', orderIds)
        .limit(1)
        .maybeSingle();

      if (itemError) return apiError(itemError.message, 500);
      if (!purchasedItem) return apiError('You can review only products from your completed purchases.', 403);

      const { data: existingReview, error: existingError } = await supabase
        .from('zoal_reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', body.product_id)
        .limit(1)
        .maybeSingle();

      if (existingError) return apiError(existingError.message, 500);
      if (existingReview) return apiError('You already have a review for this product.', 409);
    }

    const { data: review, error } = await supabase
      .from('zoal_reviews')
      .insert({
        user_id: user.id,
        product_id: body.product_id,
        rating,
        comment: body.comment,
        // Production moderation: new customer reviews remain pending until approved.
        is_approved: false
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(review, 201);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}