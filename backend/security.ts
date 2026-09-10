import { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production';
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.supabase.in https://*.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://images.unsplash.com https://i.imgur.com https://*.google.com https://*.run.app",
    "connect-src 'self' ws: wss: https://*.supabase.co https://*.supabase.in https://api.studio https://*.google.com https://*.run.app",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://*.supabase.co https://www.google.com https://maps.google.com https://*.google.com",
    `frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app${!isProd ? ' *' : ''}`
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  if (isProd) res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  next();
}

interface RateLimitInfo { count: number; resetTime: number; }
const ipCache = new Map<string, RateLimitInfo>();
export function rateLimiterMiddleware(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ip = Array.isArray(rawIp) ? rawIp[0] : (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : 'unknown');
    const now = Date.now();
    let limitInfo = ipCache.get(ip);
    if (!limitInfo || now > limitInfo.resetTime) limitInfo = { count: 0, resetTime: now + windowMs };
    limitInfo.count++;
    ipCache.set(ip, limitInfo);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - limitInfo.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000));
    if (limitInfo.count > maxRequests) return res.status(429).json({ error: 'Too Many Requests', message: 'Too many requests originating from this source. Protection rate limit exceeded. Please retry in 15 minutes.' });
    next();
  };
}
export function userRateLimiterMiddleware(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) { return rateLimiterMiddleware(maxRequests, windowMs); }
export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const authHeader = req.headers.authorization;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (headerValue && headerValue.startsWith('Bearer ')) return next();
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host && !origin.includes(host)) return res.status(403).json({ error: 'Forbidden', message: 'CSRF Check Failed: Requester origin is untrusted.' });
  next();
}

export function sanitizeValue(input: any, key?: string): any {
  if (typeof input === 'string') {
    const skipSlashFields = new Set(['desktop_image','mobile_image','hero_image_desktop','hero_image_mobile','image','image_url','thumbnail','thumbnail_url','banner','banner_image','logo','logo_url','icon','avatar','og_image','canonical_url','url','src','background_image','images','image_urls','images360','gallery','image_urls_arr']);
    const isUrlValue = (key && skipSlashFields.has(key)) || input.startsWith('http://') || input.startsWith('https://') || input.startsWith('blob:') || input.startsWith('data:') || input.startsWith('/') || input.includes('supabase.co') || input.includes('storage/v1/object') || /&#x2F;/i.test(input);
    if (isUrlValue) {
      let cleaned = input.replace(/&#x2F;/gi, '/');
      if (/[<>"']/.test(cleaned)) cleaned = cleaned.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
      return cleaned;
    }
    return input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;');
  }
  if (Array.isArray(input)) return input.map(item => sanitizeValue(item, key));
  if (typeof input === 'object' && input !== null) {
    const sanitizedObj: any = {};
    for (const k in input) if (Object.prototype.hasOwnProperty.call(input, k)) sanitizedObj[k] = sanitizeValue(input[k], k);
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

import { getSupabaseClient, getServiceSupabaseClient } from './supabase.ts';
export const ROLE_HIERARCHY: Record<string, number> = { customer: 1, author: 1.5, staff: 2, editor: 2.5, manager: 3, admin: 4, owner: 5 };
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['can_manage_orders','can_manage_products','can_manage_users','can_manage_inventory','can_issue_refund','can_view_reports','can_manage_settings','can_manage_blog','can_manage_support'],
  admin: ['can_manage_orders','can_manage_products','can_manage_users','can_manage_inventory','can_issue_refund','can_view_reports','can_manage_settings','can_manage_blog','can_manage_support'],
  manager: ['can_manage_orders','can_manage_products','can_manage_inventory','can_view_reports','can_manage_blog','can_manage_support'],
  staff: ['can_manage_orders','can_manage_products','can_manage_inventory','can_manage_blog','can_manage_support'],
  editor: ['can_edit_all_blog'],
  author: ['can_create_blog_draft','can_edit_own_blog_draft'],
  customer: []
};

export async function syncSupabaseUser(user: any) {
  const serviceSupabase = getServiceSupabaseClient();
  const supabase = getSupabaseClient() || serviceSupabase;
  const dbClient = serviceSupabase || supabase;
  if (!dbClient) throw new Error('Auth service unavailable.');
  if (typeof user === 'string') {
    const authClient = supabase || serviceSupabase;
    if (!authClient) throw new Error('Auth service unavailable.');
    const { data: { user: resolvedUser }, error } = await authClient.auth.getUser(user);
    if (error || !resolvedUser) return null;
    user = resolvedUser;
  }
  if (!user || !user.id) return null;
  let { data: profile } = await dbClient.from('zoal_users').select('*').eq('id', user.id).maybeSingle();
  const userEmail = (user.email && user.email.trim() !== '') ? user.email.trim().toLowerCase() : `${user.id}@no-email.zoal.com`;
  if (!profile && userEmail) {
    const { data: existingEmailProfile } = await dbClient.from('zoal_users').select('*').eq('email', userEmail).maybeSingle();
    if (existingEmailProfile && existingEmailProfile.id !== user.id) return null;
  }
  if (!profile) {
    const metadata = user.user_metadata || {};
    const v_full_name = metadata.full_name || '';
    const v_first_name = metadata.first_name || metadata.firstName || v_full_name.split(' ')[0] || 'User';
    const v_last_name = metadata.last_name || metadata.lastName || v_full_name.substring(v_full_name.indexOf(' ') + 1) || '';
    const v_phone = metadata.phone || user.phone || '0000000000';
    const defaultRole = 'customer';
    const newProfile = { id: user.id, first_name: v_first_name, last_name: v_last_name, email: userEmail, phone: v_phone || '0000000000', password_hash: 'PROTECTED', role: defaultRole, is_verified: user.email_confirmed_at ? true : false, addresses: [], created_at: new Date().toISOString() };
    const { data: upsertedProfile, error: upsertError } = await dbClient.from('zoal_users').upsert(newProfile, { onConflict: 'id' }).select().maybeSingle();
    if (!upsertError && upsertedProfile) profile = upsertedProfile;
    if (!profile) profile = { ...newProfile, addresses: [] };
  }
  const safeProfile = { id: profile?.id || user.id, email: profile?.email || user.email || '', first_name: profile?.first_name || 'User', last_name: profile?.last_name || '', role: profile?.role || 'customer', phone: profile?.phone || '', is_verified: profile?.is_verified || false, addresses: profile?.addresses || [] };
  return { id: safeProfile.id, email: safeProfile.email, firstName: safeProfile.first_name, lastName: safeProfile.last_name, name: `${safeProfile.first_name} ${safeProfile.last_name}`.trim(), phone: safeProfile.phone, role: safeProfile.role, isVerified: safeProfile.is_verified, addresses: safeProfile.addresses, permissions: ROLE_PERMISSIONS[safeProfile.role] || [] };
}

export async function authenticateRequest(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!headerValue || !headerValue.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized', message: 'Access denied. No valid authentication token provided.' });
  const token = headerValue.substring(7);
  const serviceSupabase = getServiceSupabaseClient();
  const supabase = getSupabaseClient() || serviceSupabase;
  const authClient = supabase || serviceSupabase;
  if (!authClient) return res.status(500).json({ error: 'Internal Server Error', message: 'Auth service unavailable.' });
  try {
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized', message: 'Session expired or invalid token.' });
    req.user = await syncSupabaseUser(user);
    if (!req.user) return res.status(403).json({ error: 'Forbidden', message: 'Account identity could not be reconciled safely. Administrative recovery is required.' });
    next();
  } catch (err: any) { return res.status(err.message === 'Auth service unavailable.' ? 500 : 403).json({ error: err.message === 'Auth service unavailable.' ? 'Internal Server Error' : 'Forbidden', message: err.message }); }
}

export async function optionalAuthenticate(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!headerValue || !headerValue.startsWith('Bearer ')) { req.user = null; return next(); }
  const token = headerValue.substring(7);
  const serviceSupabase = getServiceSupabaseClient();
  const supabase = getSupabaseClient() || serviceSupabase;
  const authClient = supabase || serviceSupabase;
  if (!authClient) { req.user = null; return next(); }
  try {
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized', message: 'Session expired or invalid token.' });
    req.user = await syncSupabaseUser(user);
    if (!req.user) return res.status(403).json({ error: 'Forbidden', message: 'Account identity could not be reconciled safely. Administrative recovery is required.' });
    next();
  } catch (err: any) { return res.status(401).json({ error: 'Unauthorized', message: err?.message || 'Authentication failed.' }); }
}

export function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    const userLevel = ROLE_HIERARCHY[req.user.role];
    const allowedLevels = allowedRoles.map(r => ROLE_HIERARCHY[r]).filter(level => typeof level === 'number');
    if (typeof userLevel !== 'number' || allowedLevels.length === 0) return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid role policy.' });
    const minRequiredLevel = Math.min(...allowedLevels);
    if (userLevel < minRequiredLevel && !allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden', message: `Access denied. Requires role/hierarchy of: ${allowedRoles.join(', ')}` });
    next();
  };
}
export function requirePermission(permission: string) {
  return (req: any, res: any, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    const permissions = req.user.permissions || [];
    if (!permissions.includes(permission)) return res.status(403).json({ error: 'Forbidden', message: `Access denied. Missing required permission: ${permission}` });
    next();
  };
}
export const requireSupportStaff = requirePermission('can_manage_support');

const submissionCache = new Map<string, number>();
export async function validateContactSecurity(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.body) req.body = {};
    const { email, message, msg, captchaToken } = req.body;
    const finalMessage = message || msg || '';
    const safeEmail = email || '';
    const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    const now = Date.now();
    const ipKey = `contact_ip_${ip}`;
    const lastSubmission = submissionCache.get(ipKey) || 0;
    const contentHash = Buffer.from(`${safeEmail}:${finalMessage}`).toString('base64').substring(0, 32);
    const contentKey = `contact_content_${contentHash}`;
    const lastContentSubmission = submissionCache.get(contentKey) || 0;
    if (now - lastSubmission < 5000) return res.status(429).json({ error: 'Too Many Requests', message: 'Please wait a moment before sending another message.' });
    if (now - lastContentSubmission < 600000) return res.status(409).json({ error: 'Conflict', message: 'Duplicate message detected. If you have more to add, please wait or use a different message.' });
    const spamKeywords = ['crypto','bitcoin','viagra','casino','lottery','prize','invest','payout','winner'];
    const lowercaseMsg = finalMessage.toLowerCase();
    const isSpam = spamKeywords.some((keyword: string) => lowercaseMsg.includes(keyword));
    const linkCount = (lowercaseMsg.match(/https?:\/\//g) || []).length;
    if (isSpam || linkCount > 2) return res.status(403).json({ error: 'Forbidden', message: 'Your message was flagged as spam by our security filters.' });
    if (process.env.REQUIRE_CAPTCHA === 'true' && !captchaToken) return res.status(400).json({ error: 'Bad Request', message: 'Security verification (Captcha) is required but missing.' });
    req.securityMetadata = { ip, userAgent: req.headers['user-agent'], timestamp: new Date().toISOString(), isSpamCandidate: isSpam };
    submissionCache.set(ipKey, now);
    submissionCache.set(contentKey, now);
    if (submissionCache.size > 1000) {
      const expireTime = now - 3600000;
      for (const [key, time] of submissionCache.entries()) if (time < expireTime) submissionCache.delete(key);
    }
    next();
  } catch (err: any) { return res.status(500).json({ error: err.message || 'Security validation failed.' }); }
}

export function serveRobotsTxt(req: Request, res: Response) {
  const host = req.headers.host || 'alzoal.com';
  const protocol = req.secure ? 'https' : 'http';
  const robots = ['User-agent: *','Allow: /','Disallow: /admin','Disallow: /api/','Disallow: /dashboard','',`Sitemap: ${protocol}://${host}/sitemap.xml`].join('\n');
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
