import multer from 'multer';
import { getSupabaseClient, getCleanSupabaseUrl } from './supabase';
import { validateFileSecurity } from './file_security';

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
  // --- PRODUCTION SECURITY AUDIT START ---
  const securityCheck = validateFileSecurity(filePath, fileBuffer, mimeType, bucket);
  if (!securityCheck.valid) {
    console.error(`🛡️ SECURITY ALERT: Rejected upload attempt for ${filePath} in bucket ${bucket}. Reason: ${securityCheck.error}`);
    return { success: false, error: securityCheck.error };
  }

  // Use sanitized buffer if available (e.g. for SVGs)
  const finalBuffer = securityCheck.sanitizedBuffer || fileBuffer;
  // --- PRODUCTION SECURITY AUDIT END ---

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    // Sanitize the filepath (remove leading slashes, resolve double-slashes)
    const sanitizedPath = filePath.replace(/^\/+/, '').replace(/\/+/g, '/');

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(sanitizedPath, finalBuffer, {
        contentType: mimeType,
        upsert: true, // Replace if already exists
        cacheControl: '3600' // 1 hour browser cache
      });

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
  const supabase = getSupabaseClient();
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
