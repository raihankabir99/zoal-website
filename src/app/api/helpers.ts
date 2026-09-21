import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazily read Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase public credentials are not configured.');
}
export const supabase = createClient(supabaseUrl, supabaseKey);

// Basic Rate Limiting Map
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests/min

/**
 * Validates request IP and applies rate limiting.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(req: NextRequest): boolean {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  const limitInfo = rateLimitMap.get(ip);

  if (!limitInfo) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (now - limitInfo.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (limitInfo.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  limitInfo.count += 1;
  return true;
}

/**
 * Standardized API Response helper
 */
export function apiResponse<T>(data: T, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(
    { success: status >= 200 && status < 300, data },
    { status, headers }
  );
}

/**
 * Standardized API Error Response helper
 */
export function apiError(message: string, status = 500, details?: any) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}

/**
 * RBAC Verification Helper
 * Supports both the legacy zoal_sessions token and a Supabase Auth access token.
 * This keeps existing custom-auth sessions working while allowing Supabase OAuth/OTP sessions
 * to authenticate against the same server-side RBAC checks.
 */
export async function verifyAuthAndRole(
  req: NextRequest,
  allowedRoles: ('customer' | 'staff' | 'admin' | 'owner' | 'manager')[]
): Promise<{ user: any; error?: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: apiError('Authentication token is required', 401) };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { user: null, error: apiError('Authentication token is required', 401) };
  }

  // First preserve the existing custom-session authentication path.
  const { data: legacySession } = await supabase
    .from('zoal_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (legacySession) {
    if (new Date(legacySession.expires_at) < new Date()) {
      return { user: null, error: apiError('Authentication session has expired', 401) };
    }

    const { data: user, error: userErr } = await supabase
      .from('zoal_users')
      .select('id, first_name, last_name, email, phone, role')
      .eq('id', legacySession.user_id)
      .single();

    if (userErr || !user) {
      return { user: null, error: apiError('User record not found', 404) };
    }

    if (!allowedRoles.includes(user.role as any)) {
      return { user: null, error: apiError('Forbidden: Insufficient privileges for this operation', 403) };
    }

    return { user };
  }

  // Then support native Supabase Auth access tokens used by OAuth/OTP sessions.
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return { user: null, error: apiError('Invalid or expired authentication token', 401) };
  }

  const { data: user, error: userErr } = await supabase
    .from('zoal_users')
    .select('id, first_name, last_name, email, phone, role')
    .eq('id', authData.user.id)
    .single();

  if (userErr || !user) {
    return { user: null, error: apiError('User record not found', 404) };
  }

  if (!allowedRoles.includes(user.role as any)) {
    return { user: null, error: apiError('Forbidden: Insufficient privileges for this operation', 403) };
  }

  return { user };
}

/**
 * Basic Validation helper
 */
export function validateFields(body: any, requiredFields: string[]): string | null {
  if (!body || typeof body !== 'object') {
    return 'Invalid or missing JSON payload';
  }
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Missing required field: '${field}'`;
    }
  }
  return null;
}
