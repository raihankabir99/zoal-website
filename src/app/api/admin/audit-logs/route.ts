import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, apiError, verifyAuthAndRole } from '../../helpers';

/**
 * GET /api/admin/audit-logs
 * Read-only access to the authoritative zoal_activity_logs ledger.
 * RBAC: Admin access only. Writes are never exposed through this route.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  const auth = await verifyAuthAndRole(req, ['admin']);
  if (auth.error) return auth.error;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return apiError('Audit ledger service is not configured', 500);
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get('limit') || 50);
    const offsetParam = Number(searchParams.get('offset') || 0);
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 50, 1), 100);
    const offset = Math.max(Number.isFinite(offsetParam) ? offsetParam : 0, 0);

    let query = supabase
      .from('zoal_activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    const action = searchParams.get('action');
    const severity = searchParams.get('severity');
    const resourceType = searchParams.get('resource_type');
    const source = searchParams.get('source');

    if (action) query = query.eq('action', action);
    if (severity) query = query.eq('severity', severity);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (source) query = query.eq('source', source);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to read authoritative audit ledger:', error.message);
      return apiError('Failed to load audit logs', 500);
    }

    // Preserve the existing SecuritySettingsCenter contract: it expects an array.
    return NextResponse.json(data || [], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err: any) {
    console.error('Audit log API error:', err?.message || err);
    return apiError('Failed to load audit logs', 500);
  }
}
