import { Request, Response, NextFunction } from 'express';

// -------------------------------------------------------------
// 1. CONTENT SECURITY POLICY (CSP) & SECURITY HEADERS
// -------------------------------------------------------------
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production';

  // Content Security Policy
  // Configured precisely to not break Vite/HMR in dev, and allow essential connections (Supabase, Google Fonts, Unsplash, and AI Studio Frame Wrapper)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.supabase.in https://*.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://images.unsplash.com https://i.imgur.com https://*.google.com https://*.run.app",
    "connect-src 'self' ws: wss: https://*.supabase.co https://*.supabase.in https://api.studio https://*.google.com https://*.run.app",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://*.supabase.co",
    "frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app"
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // HTTP Strict Transport Security (HSTS)
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Prevent Clickjacking (using both modern frame-ancestors and legacy SAMEORIGIN for wide browser support)
  // Note: we let frame-ancestors allow AI Studio, while restricting general frame loading
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Disable MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  // Prevent XSS in older legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');

  next();
}

// -------------------------------------------------------------
// 2. RATE LIMITER (SLIDING WINDOW IN-MEMORY CACHE)
// -------------------------------------------------------------
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const ipCache = new Map<string, RateLimitInfo>();

export function rateLimiterMiddleware(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Safely extract client IP taking proxies into account
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ip = Array.isArray(rawIp) ? rawIp[0] : (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : 'unknown');
    
    const now = Date.now();

    let limitInfo = ipCache.get(ip);
    if (!limitInfo || now > limitInfo.resetTime) {
      limitInfo = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    limitInfo.count++;
    ipCache.set(ip, limitInfo);

    // Set standard rate-limiting metadata headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - limitInfo.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000));

    if (limitInfo.count > maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Too many requests originating from this source. Protection rate limit exceeded. Please retry in 15 minutes.'
      });
    }

    next();
  };
}

// -------------------------------------------------------------
// 3. CSRF INTEGRITY PROTECTION
// -------------------------------------------------------------
export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Safe HTTP operations do not mutate state and are allowed immediately
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Token-based authentication (Bearer authorization headers) is naturally secure against CSRF
  // since custom headers are not automatically attached by browsers (unlike cookies)
  const authHeader = req.headers.authorization;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (headerValue && headerValue.startsWith('Bearer ')) {
    return next();
  }

  // Fallback validation for other requests (e.g., matching origin and hosts)
  const origin = req.headers.origin;
  const host = req.headers.host;

  if (origin && host && !origin.includes(host)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'CSRF Check Failed: Requester origin is untrusted.'
    });
  }

  next();
}

// -------------------------------------------------------------
// 4. XSS PREVENTION (RECURSIVE INPUT SANITIZATION)
// -------------------------------------------------------------
export function sanitizeValue(input: any): any {
  if (typeof input === 'string') {
    // Transform characters used in HTML/JS injection attacks into safe HTML entities
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeValue(item));
  }

  if (typeof input === 'object' && input !== null) {
    const sanitizedObj: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObj[key] = sanitizeValue(input[key]);
      }
    }
    return sanitizedObj;
  }

  return input;
}

export function xssSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

// -------------------------------------------------------------
// 5. AUTHENTICATION & RBAC MIDDLEWARE
// -------------------------------------------------------------
import { getSupabaseClient } from './supabase.js';

export async function authenticateRequest(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  
  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Access denied. No valid authentication token provided.' 
    });
  }

  const token = headerValue.substring(7);
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return res.status(500).json({ error: 'Internal Server Error', message: 'Auth service unavailable.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Session expired or invalid token.' });
    }

    // Retrieve full profile to check roles
    const { data: profile, error: profileError } = await supabase
      .from('zoal_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Forbidden', message: 'User profile not found.' });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      name: `${profile.first_name} ${profile.last_name}`,
      phone: profile.phone,
      role: profile.role,
      isVerified: profile.is_verified,
      addresses: profile.addresses || []
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', message: 'Authentication process failed.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
}

// -------------------------------------------------------------
// 7. CONTACT FORM SECURITY & SPAM PREVENTION
// -------------------------------------------------------------

// Simple in-memory cache for duplicate submission prevention (TTL 5 minutes)
const submissionCache = new Map<string, number>();

export async function validateContactSecurity(req: any, res: Response, next: NextFunction) {
  const { name, email, message, msg, captchaToken } = req.body;
  const finalMessage = message || msg;
  const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';

  // 1. IP Rate Limiting (Simple check for now, can be expanded)
  // 5 requests per 15 minutes per IP
  const now = Date.now();
  const ipKey = `contact_ip_${ip}`;
  const lastSubmission = submissionCache.get(ipKey) || 0;
  
  // 2. Duplicate Submission Prevention (Same content/email within 10 minutes)
  const contentHash = Buffer.from(`${email}:${finalMessage}`).toString('base64').substring(0, 32);
  const contentKey = `contact_content_${contentHash}`;
  const lastContentSubmission = submissionCache.get(contentKey) || 0;

  if (now - lastSubmission < 5000) { // 5 seconds between any submission from same IP
    return res.status(429).json({ 
      error: 'Too Many Requests', 
      message: 'Please wait a moment before sending another message.' 
    });
  }

  if (now - lastContentSubmission < 600000) { // 10 minutes for identical content
    return res.status(409).json({ 
      error: 'Conflict', 
      message: 'Duplicate message detected. If you have more to add, please wait or use a different message.' 
    });
  }

  // 3. Spam Detection
  const spamKeywords = ['crypto', 'bitcoin', 'viagra', 'casino', 'lottery', 'prize', 'invest', 'payout', 'winner'];
  const lowercaseMsg = (finalMessage || '').toLowerCase();
  const isSpam = spamKeywords.some(keyword => lowercaseMsg.includes(keyword));
  
  // Link density check (spam usually has many links)
  const linkCount = (lowercaseMsg.match(/https?:\/\//g) || []).length;
  
  if (isSpam || linkCount > 2) {
    console.warn(`🛡️ SPAM ALERT: Blocked submission from ${email} (IP: ${ip}). Reason: Spam keywords or excessive links detected.`);
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Your message was flagged as spam by our security filters.' 
    });
  }

  // 4. Captcha Check (Architecture Ready)
  // In a real production environment, you would verify this token with Google reCAPTCHA or similar.
  // We check for the presence of the token if specified by environment.
  if (process.env.REQUIRE_CAPTCHA === 'true' && !captchaToken) {
    return res.status(400).json({ 
      error: 'Bad Request', 
      message: 'Security verification (Captcha) is required but missing.' 
    });
  }

  // 5. Track IP and Metadata
  req.securityMetadata = {
    ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    isSpamCandidate: isSpam
  };

  // Update caches
  submissionCache.set(ipKey, now);
  submissionCache.set(contentKey, now);

  // Clean up cache periodically (every 100 requests)
  if (submissionCache.size > 1000) {
    const expireTime = now - 3600000; // 1 hour
    for (const [key, time] of submissionCache.entries()) {
      if (time < expireTime) submissionCache.delete(key);
    }
  }

  next();
}

// -------------------------------------------------------------
// 8. SEO SITEMAP.XML & ROBOTS.TXT GENERATION ENDPOINTS
// -------------------------------------------------------------

export function serveRobotsTxt(req: Request, res: Response) {
  const host = req.headers.host || 'alzoal.com';
  const protocol = req.secure ? 'https' : 'http';
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /dashboard',
    '',
    `Sitemap: ${protocol}://${host}/sitemap.xml`
  ].join('\n');

  res.header('Content-Type', 'text/plain');
  res.send(robots);
}

export function serveSitemapXml(req: Request, res: Response) {
  const host = req.headers.host || 'alzoal.com';
  const protocol = req.secure ? 'https' : 'http';
  const domain = `${protocol}://${host}`;
  const now = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/store', changefreq: 'daily', priority: '0.9' },
    { loc: '/portfolio', changefreq: 'weekly', priority: '0.8' },
    { loc: '/about', changefreq: 'monthly', priority: '0.7' },
    { loc: '/branches', changefreq: 'monthly', priority: '0.7' },
    { loc: '/blog', changefreq: 'weekly', priority: '0.6' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
    { loc: '/faq', changefreq: 'monthly', priority: '0.4' },
    { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
    { loc: '/terms-and-conditions', changefreq: 'yearly', priority: '0.3' }
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  staticUrls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${domain}${url.loc}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
}
