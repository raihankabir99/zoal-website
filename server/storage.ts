import multer from 'multer';
import { getSupabaseClient, getCleanSupabaseUrl, getServiceSupabaseClient } from './supabase';

// Configure Multer for in-memory file handling (production-ready, avoids disk I/O)
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size limit (documents bucket)
  }
});

export const storageUploadMiddleware = uploadMemory.single('file');
export const storageMultipleUploadMiddleware = uploadMemory.array('files', 10); // support uploading up to 10 files

/**
 * Uploads a file buffer directly to a specified Supabase Storage bucket.
 * 
 * @param bucket Name of the Supabase bucket (e.g. 'products', 'avatars')
 * @param filePath Path inside the bucket (e.g. 'products/item-123.jpg' or '1234/avatar.png')
 * @param fileBuffer Buffer of the file content
 * @param mimeType MIME content type (e.g. 'image/jpeg')
 * @returns {Promise<{ success: boolean; url?: string; error?: string }>}
 */
export async function uploadToSupabase(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // Use Service Role client to bypass RLS for administrative uploads
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    // Sanitize the filepath (remove leading slashes, resolve double-slashes)
    const sanitizedPath = filePath.replace(/^\/+/, '').replace(/\/+/g, '/');

    let { data, error } = await supabase.storage
      .from(bucket)
      .upload(sanitizedPath, fileBuffer, {
        contentType: mimeType,
        upsert: true, // Replace if already exists
        cacheControl: '3600' // 1 hour browser cache
      });

    if (error && (error.message?.toLowerCase().includes('bucket not found') || (error as any).statusCode === '404' || (error as any).status === 404)) {
      try {
        console.log(`Creating missing storage bucket "${bucket}"...`);
        await supabase.storage.createBucket(bucket, { public: bucket !== 'invoices' });
        const retry = await supabase.storage.from(bucket).upload(sanitizedPath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '3600'
        });
        data = retry.data;
        error = retry.error;
      } catch (e: any) {
        console.warn(`Failed to auto-create bucket "${bucket}":`, e?.message);
      }
    }

    if (error) {
      console.error(`❌ Supabase Storage upload error [Bucket: ${bucket}, Path: ${sanitizedPath}]:`, error.message);
      return { success: false, error: error.message };
    }

    // Retrieve public URL if it's not the private 'invoices' bucket
    let publicUrl = '';
    if (bucket !== 'invoices') {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(sanitizedPath);
      publicUrl = urlData?.publicUrl || '';
    } else {
      // Invoices is a private bucket - returns path for authenticated download
      publicUrl = `/api/storage/private/${bucket}/${sanitizedPath}`;
    }

    return {
      success: true,
      url: publicUrl
    };
  } catch (err: any) {
    console.error(`❌ Exception in uploadToSupabase:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Deletes a file from a specified Supabase Storage bucket.
 * 
 * @param bucket Name of the Supabase bucket
 * @param filePath Path inside the bucket
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export async function deleteFromSupabase(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  // Use Service Role client to bypass RLS for administrative deletions
  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    const sanitizedPath = filePath.replace(/^\/+/, '').replace(/\/+/g, '/');
    const { error } = await supabase.storage.from(bucket).remove([sanitizedPath]);

    if (error) {
      console.error(`❌ Supabase Storage deletion error [Bucket: ${bucket}, Path: ${sanitizedPath}]:`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error(`❌ Exception in deleteFromSupabase:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Generates an Optimized Image URL leveraging Supabase's native CDN-cached Image Optimization engine.
 * 
 * @param bucket Bucket containing the image
 * @param filePath Path to the image
 * @param options Optimization parameters (width, height, quality, resize)
 * @returns {string} The optimized image rendering URL
 */
export function getOptimizedImageUrl(
  bucket: string,
  filePath: string,
  options: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {}
): string {
  const supabaseUrl = getCleanSupabaseUrl();
  if (!supabaseUrl) return '';

  const sanitizedPath = filePath.replace(/^\/+/, '').replace(/\/+/g, '/');
  
  // Format query params for Supabase Image Optimization endpoint
  const params = new URLSearchParams();
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.resize) params.append('resize', options.resize);

  const queryStr = params.toString();
  const baseOptimizedUrl = `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${sanitizedPath}`;
  
  return queryStr ? `${baseOptimizedUrl}?${queryStr}` : baseOptimizedUrl;
}

/**
 * Extracts and normalizes the filename from a URL or storage path.
 */
export function extractFilename(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('/src/') || trimmed.startsWith('/assets/') || trimmed.includes('placeholder') || trimmed.includes('hero-coffee-beans') || trimmed.includes('hero-interior')) {
    return null;
  }
  const parts = trimmed.split('/');
  const filename = parts[parts.length - 1]?.split('?')[0];
  return filename ? filename.toLowerCase() : null;
}

/**
 * Checks across all CMS and product tables to see how many records reference a given image filename.
 */
export async function checkImageReferences(supabase: any, targetFilename: string): Promise<number> {
  if (!targetFilename) return 0;
  const targetLower = targetFilename.toLowerCase();
  let refCount = 0;

  const tablesToCheck = [
    { table: 'zoal_homepage_heroes', cols: ['hero_image_desktop', 'hero_image_mobile'] },
    { table: 'zoal_banners', cols: ['desktop_image', 'mobile_image'] },
    { table: 'zoal_homepage_blocks', cols: ['image', 'background_image', 'thumbnail'] },
    { table: 'zoal_products', cols: ['image', 'featured_image', 'gallery'] },
    { table: 'zoal_categories', cols: ['image'] },
    { table: 'zoal_brands', cols: ['logo', 'banner'] },
    { table: 'zoal_blog_posts', cols: ['featured_image', 'cover_image'] },
    { table: 'zoal_editorial_lookbook', cols: ['image', 'thumbnail'] },
    { table: 'zoal_blog_media', cols: ['url', 'file_url'] }
  ];

  for (const item of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(item.table).select(item.cols.join(', '));
      if (!error && data) {
        for (const row of data) {
          for (const col of item.cols) {
            const val = row[col];
            if (val) {
              if (Array.isArray(val)) {
                for (const itemVal of val) {
                  const fname = extractFilename(typeof itemVal === 'string' ? itemVal : (itemVal?.url || itemVal?.file_url));
                  if (fname === targetLower) refCount++;
                }
              } else if (typeof val === 'string') {
                if (val.includes(',')) {
                  const parts = val.split(',');
                  for (const p of parts) {
                    if (extractFilename(p) === targetLower) refCount++;
                  }
                } else {
                  if (extractFilename(val) === targetLower) refCount++;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // Table might not exist in this environment, ignore gracefully
    }
  }

  return refCount;
}

