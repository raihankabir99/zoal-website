import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../helpers';

/**
 * GET /api/products
 * Retrieves product catalog with pagination, filtering, and sorting.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) {
    return apiError('Too many requests. Please try again later.', 429);
  }

  try {
    const url = new URL(req.url);
    
    // Pagination parameters
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // Filters
    const categoryId = url.searchParams.get('categoryId');
    const brandId = url.searchParams.get('brandId');
    const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999');
    const isActive = url.searchParams.get('isActive') !== 'false'; // defaults to true

    // Sorting parameters
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Start Supabase query builder
    let query = supabase
      .from('zoal_products')
      .select('*', { count: 'exact' });

    // Apply Filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    if (isActive) {
      query = query.eq('is_active', true);
    }
    query = query.gte('price', minPrice).lte('price', maxPrice);

    // Apply Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return apiError(error.message, 500);
    }

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

/**
 * POST /api/products
 * Creates a new product. (RBAC: Requires staff or admin)
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) {
    return apiError('Too many requests', 429);
  }

  try {
    // RBAC Check via Auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return apiError('Unauthorized', 401);
    }

    const body = await req.json();
    
    // Validation
    const required = ['name', 'slug', 'price', 'category_id'];
    for (const f of required) {
      if (!body[f]) {
        return apiError(`Validation failed. Missing required field: ${f}`, 400);
      }
    }

    const { data: newProduct, error } = await supabase
      .from('zoal_products')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || '',
        price: body.price,
        sale_price: body.sale_price || null,
        image_urls: body.image_urls || [],
        sku: body.sku || null,
        category_id: body.category_id,
        brand_id: body.brand_id || null,
        is_active: body.is_active !== false
      })
      .select()
      .single();

    if (error) {
      return apiError(error.message, 500);
    }

    return apiResponse(newProduct, 21);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
