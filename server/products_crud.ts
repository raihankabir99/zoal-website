import { Request, Response } from 'express';
import crypto from 'crypto';
import { getSupabaseClient, getServiceSupabaseClient } from '../backend/supabase.ts';
import { friendlyToUUID } from '../src/lib/uuidMapper.ts';

function getSupabase() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

/**
 * Strict permission check helper for admin/manager/owner/staff roles
 */
function isAuthorized(req: any): boolean {
  if (!req.user) return false;
  const role = String(req.user.role).toLowerCase();
  return ['owner', 'admin', 'manager', 'staff'].includes(role);
}

/**
 * POST /api/products
 * Creates a new product, or routes to update if ID already exists.
 */
export async function createProduct(req: Request, res: Response) {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Requires Owner, Admin, Manager, or Staff role.' });
  }

  const body = req.body;
  if (!body || !body.name || !body.slug || body.price === undefined) {
    return res.status(400).json({ error: 'Validation failed', message: 'Missing required fields: name, slug, price' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database unavailable', message: 'Database is not configured.' });
  }

  const productId = body.id || crypto.randomUUID();
  const uuid = friendlyToUUID(productId);

  let imagesList: string[] = [];
  if (Array.isArray(body.images)) {
    imagesList = [...body.images];
  } else if (body.images && typeof body.images === 'string') {
    imagesList = [body.images];
  } else if (Array.isArray(body.image_urls)) {
    imagesList = [...body.image_urls];
  } else if (body.image_urls && typeof body.image_urls === 'string') {
    imagesList = [body.image_urls];
  } else if (body.image && typeof body.image === 'string') {
    imagesList = [body.image];
  } else if (body.image_url && typeof body.image_url === 'string') {
    imagesList = [body.image_url];
  }
  const primaryImage = imagesList[0] || '';

  const price = Number(body.price) || 0;
  const salePrice = body.salePrice !== undefined && body.salePrice !== null ? Number(body.salePrice) : null;
  const isActive = body.isActive !== false && body.is_active !== false;

  const completeProductJson = {
    ...body,
    id: productId,
    category: body.category || 'Coffee',
    brand: body.brand || 'Al Zoal',
    images: imagesList,
    image_urls: imagesList,
    image: primaryImage,
    image_url: primaryImage,
    price,
    salePrice,
    isActive
  };

  try {
    const { error } = await supabase
      .from('zoal_supabase_products')
      .upsert({
        id: uuid,
        friendly_id: productId,
        name: body.name,
        category: body.category || 'Coffee',
        price,
        is_active: isActive,
        data: completeProductJson,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('[Create Product] Supabase error:', error.message || error);
      return res.status(500).json({ error: 'Transaction failed', message: error.message || String(error) });
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully with complete synchronization.',
      product: completeProductJson
    });
  } catch (err: any) {
    console.error('[Create Product] Exception:', err);
    return res.status(500).json({ error: 'Transaction failed', message: err.message || 'Failed to create product.' });
  }
}

/**
 * PUT /api/products/:id
 * Fully updates an existing product.
 */
export async function updateProduct(req: Request, res: Response) {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Requires Owner, Admin, Manager, or Staff role.' });
  }

  const id = req.params.id || req.body?.id;
  const body = req.body;
  if (!body || !id) {
    return res.status(400).json({ error: 'Validation failed', message: 'Missing product ID or body' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database unavailable', message: 'Database is not configured.' });
  }

  const uuid = friendlyToUUID(id);
  let imagesList: string[] = [];
  if (Array.isArray(body.images)) {
    imagesList = [...body.images];
  } else if (body.images && typeof body.images === 'string') {
    imagesList = [body.images];
  } else if (Array.isArray(body.image_urls)) {
    imagesList = [...body.image_urls];
  } else if (body.image_urls && typeof body.image_urls === 'string') {
    imagesList = [body.image_urls];
  } else if (body.image && typeof body.image === 'string') {
    imagesList = [body.image];
  } else if (body.image_url && typeof body.image_url === 'string') {
    imagesList = [body.image_url];
  }
  const primaryImage = imagesList[0] || '';

  const price = Number(body.price) || 0;
  const salePrice = body.salePrice !== undefined && body.salePrice !== null ? Number(body.salePrice) : null;
  const isActive = body.isActive !== false && body.is_active !== false;

  const completeProductJson = {
    ...body,
    id,
    category: body.category || 'Coffee',
    brand: body.brand || 'Al Zoal',
    images: imagesList,
    image_urls: imagesList,
    image: primaryImage,
    image_url: primaryImage,
    price,
    salePrice,
    isActive
  };

  try {
    const { error } = await supabase
      .from('zoal_supabase_products')
      .upsert({
        id: uuid,
        friendly_id: id,
        name: body.name || 'Product',
        category: body.category || 'Coffee',
        price,
        is_active: isActive,
        data: completeProductJson,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('[Update Product] Supabase error:', error.message || error);
      return res.status(500).json({ error: 'Transaction failed', message: error.message || String(error) });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully with complete synchronization.',
      product: completeProductJson
    });
  } catch (err: any) {
    console.error('[Update Product] Exception:', err);
    return res.status(500).json({ error: 'Transaction failed', message: err.message || 'Failed to update product.' });
  }
}

/**
 * PATCH /api/products/:id
 * Partially updates an existing product.
 */
export async function patchProduct(req: Request, res: Response) {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Requires Owner, Admin, Manager, or Staff role.' });
  }

  const id = req.params.id || req.body?.id;
  const body = req.body;
  if (!body || !id) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing product ID or fields.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database unavailable', message: 'Database is not configured.' });
  }

  const uuid = friendlyToUUID(id);

  try {
    const { data: existing } = await supabase
      .from('zoal_supabase_products')
      .select('data')
      .eq('id', uuid)
      .maybeSingle();

    const mergedPayload = {
      ...(existing?.data || {}),
      ...body,
      id
    };

    req.body = mergedPayload;
    req.params.id = id;
    return updateProduct(req, res);
  } catch (err: any) {
    console.error('[Patch Product] Failed:', err);
    return res.status(500).json({ error: 'Patch failed', message: err.message || 'Failed to patch product.' });
  }
}

/**
 * DELETE /api/products/:id
 * Deletes a product from the database.
 */
export async function deleteProduct(req: Request, res: Response) {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Requires Owner, Admin, Manager, or Staff role.' });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing product ID' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Database unavailable', message: 'Database is not configured.' });
  }

  const uuid = friendlyToUUID(id);

  try {
    const { error } = await supabase
      .from('zoal_supabase_products')
      .delete()
      .eq('id', uuid);

    if (error) {
      console.error('[Delete Product] Supabase error:', error.message || error);
      return res.status(500).json({ error: 'Transaction failed', message: error.message || String(error) });
    }

    return res.status(200).json({
      success: true,
      message: `Product was successfully deleted from production table.`
    });
  } catch (err: any) {
    console.error('[Delete Product] Exception:', err);
    return res.status(500).json({ error: 'Transaction failed', message: err.message || 'Failed to delete product.' });
  }
}
