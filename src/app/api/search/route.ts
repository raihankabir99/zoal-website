import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../helpers';

/**
 * GET /api/search
 * Premium text search index queries on products with matching tags and pagination.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const url = new URL(req.url);
    const queryTerm = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    if (!queryTerm.trim()) {
      return apiResponse({ products: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } });
    }

    // Search query with fulltext style filter
    const { data: products, error, count } = await supabase
      .from('zoal_products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .or(`name.ilike.%${queryTerm}%,description.ilike.%${queryTerm}%,sku.ilike.%${queryTerm}%`)
      .range(offset, offset + limit - 1);

    if (error) return apiError(error.message, 500);

    return apiResponse({
      products,
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
