/**
 * Safely requests deletion of an image from Supabase Storage 'products' bucket
 * if it is no longer referenced anywhere across products or CMS tables.
 */
export async function deleteProductStorageImageIfUnused(imageUrl: string, bucket = 'products'): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  
  // Verify if the image belongs to Supabase Storage
  if (!imageUrl.includes('/storage/v1/object/public/') && !imageUrl.includes('.supabase.co/storage/')) {
    return false;
  }

  let storagePath = '';
  if (imageUrl.includes(`/${bucket}/`)) {
    const parts = imageUrl.split(`/${bucket}/`);
    storagePath = parts[parts.length - 1];
  } else if (imageUrl.includes('/storage/v1/object/public/')) {
    const parts = imageUrl.split('/public/');
    const subParts = parts[1]?.split('/') || [];
    if (subParts.length > 1) {
      storagePath = subParts.slice(1).join('/');
    }
  }

  // Sanitize path (strip query params if any)
  if (storagePath) {
    storagePath = storagePath.split('?')[0];
  }

  if (!storagePath) return false;

  try {
    const token = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '')
      : '';

    console.log(`[Product Storage Cleanup] Requesting reference check and cleanup for path: ${bucket}/${storagePath}`);
    const res = await fetch('/api/storage/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ bucket, path: storagePath })
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[Product Storage Cleanup] Storage deletion skipped or failed:`, data.error || data.message);
      return false;
    }

    if (data.skipped) {
      console.log(`[Product Storage Cleanup] Storage object preserved (${data.references} reference(s) remain):`, data.message);
    } else {
      console.log(`[Product Storage Cleanup] Storage object removed successfully from bucket:`, data.message);
    }

    return true;
  } catch (err: any) {
    console.warn(`[Product Storage Cleanup] Network error during storage cleanup:`, err?.message || err);
    return false;
  }
}
