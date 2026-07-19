import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../helpers';

/**
 * GET /api/brands
 * Fetch all premium brands in catalog.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const { data: brands, error } = await supabase
      .from('zoal_brands')
      .select('*')
      .order('name', { ascending: true });

    if (error) return apiError(error.message, 500);
    return apiResponse(brands);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/brands
 * Create brand (Admin and Staff)
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const body = await req.json();
    if (!body.name || !body.slug) {
      return apiError('Missing brand name or slug credentials', 400);
    }

    const { data, error } = await supabase
      .from('zoal_brands')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || '',
        logo_url: body.logo_url || ''
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(data, 201);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
