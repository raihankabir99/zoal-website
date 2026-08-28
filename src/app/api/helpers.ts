import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazily read Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';
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
 * Verifies Authorization header token and checks if user matches required roles.
 */
export async function verifyAuthAndRole(
  req: NextRequest,
  allowedRoles: ('customer' | 'staff' | 'admin')[]
): Promise<{ user: any; error?: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: apiError('Authentication token is required', 401) };
  }

  const token = authHeader.split(' ')[1];

  // Fetch session and associated user role in zoal_sessions / zoal_users
  const { data: session, error: sessionErr } = await supabase
    .from('zoal_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (sessionErr || !session) {
    return { user: null, error: apiError('Invalid or expired authentication token', 401) };
  }

  if (new Date(session.expires_at) < new Date()) {
    return { user: null, error: apiError('Authentication session has expired', 401) };
  }

  const { data: user, error: userErr } = await supabase
    .from('zoal_users')
    .select('id, first_name, last_name, email, phone, role')
    .eq('id', session.user_id)
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
