import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole } from '../helpers';

const ADMIN_ROLES = ['owner', 'admin', 'manager', 'staff'] as const;

function mapBrandPayload(body: any) {
  const payload: Record<string, any> = {};
  const map: Record<string, string> = {
    name: 'name', slug: 'slug', description: 'description', logoUrl: 'logo_url',
    nameAr: 'name_ar', coverBannerUrl: 'cover_banner_url', country: 'country',
    website: 'website', supportEmail: 'support_email', supportPhone: 'support_phone',
    brandStory: 'brand_story', brandStoryAr: 'brand_story_ar', featuredToggle: 'featured_toggle',
    status: 'status', seoTitle: 'seo_title', seoDescription: 'seo_description',
    seoKeywords: 'seo_keywords', canonicalUrl: 'canonical_url', openGraphImage: 'open_graph_image',
    structuredData: 'structured_data', galleryImages: 'gallery_images', brandVideos: 'brand_videos'
  };
  for (const [input, column] of Object.entries(map)) {
    if (body[input] !== undefined) payload[column] = body[input];
  }
  return payload;
}

export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  try {
    const { data, error } = await supabase.from('zoal_brands').select('*').order('name', { ascending: true });
    if (error) return apiError(error.message, 500);
    return apiResponse(data || []);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, ADMIN_ROLES as any);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!body?.name || !body?.slug) return apiError('Missing brand name or slug credentials', 400);
    const { data, error } = await supabase.from('zoal_brands').insert(mapBrandPayload(body)).select().single();
    if (error) {
      if (error.code === '23505') return apiError('A brand with this name or slug already exists', 409);
      return apiError(error.message, 500);
    }
    return apiResponse(data, 201);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

export async function PUT(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, ADMIN_ROLES as any);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!body?.id) return apiError('Brand id is required', 400);
    const payload = mapBrandPayload(body);
    if (Object.keys(payload).length === 0) return apiError('No brand fields supplied', 400);
    const { data, error } = await supabase.from('zoal_brands').update(payload).eq('id', body.id).select().single();
    if (error) {
      if (error.code === '23505') return apiError('A brand with this name or slug already exists', 409);
      if (error.code === 'PGRST116') return apiError('Brand not found', 404);
      return apiError(error.message, 500);
    }
    return apiResponse(data);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, ADMIN_ROLES as any);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!body?.id) return apiError('Brand id is required', 400);
    const { data, error } = await supabase.from('zoal_brands').delete().eq('id', body.id).select().single();
    if (error) {
      if (error.code === 'PGRST116') return apiError('Brand not found', 404);
      return apiError(error.message, 500);
    }
    return apiResponse(data);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
