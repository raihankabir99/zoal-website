import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../helpers';

/**
 * GET /api/categories
 * Fetch product categories.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const { data: categories, error } = await supabase
      .from('zoal_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) return apiError(error.message, 500);
    return apiResponse(categories);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/categories
 * Create new category. (Admin or Staff)
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const body = await req.json();
    if (!body.name || !body.slug) {
      return apiError('Missing required fields: name, slug', 400);
    }

    const { data, error } = await supabase
      .from('zoal_categories')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || '',
        image_url: body.image_url || ''
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(data, 201);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
