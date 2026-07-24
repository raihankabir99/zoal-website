import path from 'path';

/**
 * AL ZOAL LUXURY BOUTIQUE - FILE SECURITY SYSTEM
 * Implements strict validation for file uploads to prevent malware, XSS, and RCE.
 */

// 1. Whitelist of allowed MIME types
export const ALLOWED_MIME_TYPES = {
  products: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  categories: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  brands: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  avatars: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  gallery: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'],
  banners: ['image/jpeg', 'image/png', 'image/webp'],
  blogs: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
  invoices: ['application/pdf', 'image/jpeg', 'image/png']
};

// 2. Malicious extensions to reject regardless of MIME type
const MALICIOUS_EXTENSIONS = [
  '.php', '.php3', '.php4', '.php5', '.phtml', '.exe', '.bat', '.sh', '.js', '.jsx', '.ts', '.tsx',
  '.dll', '.vbs', '.msi', '.scr', '.cpl', '.com', '.htm', '.html', '.xhtml', '.jse', '.jar', '.cmd',
  '.ps1', '.py', '.rb', '.pl', '.cgi', '.sh', '.bash', '.zsh'
];

/**
 * Validates file signature (Magic Numbers)
 */
export function validateFileSignature(buffer: Buffer, expectedMime: string): boolean {
  // Common magic numbers
  const signatures: { [key: string]: number[] } = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // WebP starts with RIFF, then WEBP at offset 8
    'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D], // ftypisom
    'application/msword': [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04], // .docx (ZIP)
  };

  const sig = signatures[expectedMime];
  if (!sig) return true; // If we don't have a signature check for this type, pass it (MIME check will catch it)

  for (let i = 0; i < sig.length; i++) {
    if (buffer[i] !== sig[i]) return false;
  }

  // Extra check for WebP
  if (expectedMime === 'image/webp') {
    const webpHeader = buffer.toString('ascii', 8, 12);
    if (webpHeader !== 'WEBP') return false;
  }

  return true;
}

/**
 * Sanitizes SVG content to prevent XSS
 */
export function sanitizeSVG(content: string): string {
  // Remove scripts
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onmouseover, onclick, etc.)
  sanitized = sanitized.replace(/\bon\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\bon\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');
  
  // Remove javascript: links
  sanitized = sanitized.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
  sanitized = sanitized.replace(/href\s*=\s*'javascript:[^']*'/gi, 'href="#"');
  sanitized = sanitized.replace(/xlink:href\s*=\s*"javascript:[^"]*"/gi, 'xlink:href="#"');
  
  return sanitized;
}

/**
 * Performs full security audit on a file before upload
 */
export function validateFileSecurity(
  filename: string,
  buffer: Buffer,
  mimeType: string,
  bucket: string
): { valid: boolean; error?: string; sanitizedBuffer?: Buffer } {
  const ext = path.extname(filename).toLowerCase();

  // 1. Check malicious extensions
  if (MALICIOUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Security Risk: Extension ${ext} is strictly prohibited.` };
  }

  // 2. Check bucket whitelist
  const allowedForBucket = (ALLOWED_MIME_TYPES as any)[bucket];
  if (!allowedForBucket || !allowedForBucket.includes(mimeType)) {
    return { valid: false, error: `Access Denied: MIME type ${mimeType} is not allowed in bucket '${bucket}'.` };
  }

  // 3. Verify magic numbers (signatures)
  if (!validateFileSignature(buffer, mimeType)) {
    return { valid: false, error: `Security Risk: File content does not match reported MIME type ${mimeType} (Signature Mismatch).` };
  }

  // 4. SVG Sanitization
  if (mimeType === 'image/svg+xml') {
    const content = buffer.toString('utf8');
    const sanitized = sanitizeSVG(content);
    return { 
      valid: true, 
      sanitizedBuffer: Buffer.from(sanitized, 'utf8') 
    };
  }

  // 5. HTML/PHP check in buffer (extra safety)
  const head = buffer.toString('utf8', 0, 1024).toLowerCase();
  if (head.includes('<?php') || head.includes('<html') || head.includes('<script')) {
    if (mimeType !== 'image/svg+xml') { // SVGs were already sanitized
       return { valid: false, error: 'Security Risk: Malicious code detected in file content.' };
    }
  }

  return { valid: true };
}
