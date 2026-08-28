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
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('zoal_reviews')
      .select('*, zoal_users(first_name, last_name)', { count: 'exact' });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    // Default: only display approved reviews to public
    const showAll = url.searchParams.get('showAll') === 'true';
    if (!showAll) {
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
 * POST /api/reviews
 * Submit a review for a luxury product. (RBAC: Authenticated Customer)
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

    const { data: review, error } = await supabase
      .from('zoal_reviews')
      .insert({
        user_id: user.id,
        product_id: body.product_id,
        rating,
        comment: body.comment,
        is_approved: true // Auto-approved for seamless demo experience
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(review, 201);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
