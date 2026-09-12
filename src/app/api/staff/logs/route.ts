import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole } from '../../helpers';

/**
 * GET /api/staff/logs
 * Read authoritative staff activity logs. No fabricated/localStorage fallback.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin', 'owner', 'manager']);
    if (auth.error) return auth.error;

    let logsQuery = supabase
      .from('zoal_activity_logs')
      .select('id,user_id,action,timestamp,resource_type,resource_id,result,severity,source')
      .eq('resource_type', 'staff')
      .order('timestamp', { ascending: false })
      .limit(50);
    if (auth.user.role === 'staff') logsQuery = logsQuery.eq('user_id', auth.user.id);

    const [{ data: logs, error: logsError }, { count: staffMemberCount, error: staffError }] = await Promise.all([
      logsQuery,
      supabase
        .from('zoal_users')
        .select('id', { count: 'exact', head: true })
        .in('role', ['staff', 'manager', 'admin', 'owner'])
    ]);

    if (logsError) return apiError(logsError.message, 500);
    if (staffError) return apiError(staffError.message, 500);

    return apiResponse({ logs: logs || [], staffMemberCount: staffMemberCount || 0 });
  } catch (err: any) {
    return apiError(err.message || 'Staff activity logs unavailable', 500);
  }
}

/**
 * POST /api/staff/logs
 * Create an authoritative activity log for a staff operation.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin', 'owner', 'manager']);
    if (auth.error) return auth.error;

    const body = await req.json();
    const action = typeof body?.action === 'string' ? body.action.trim() : '';
    const target = typeof body?.target === 'string' ? body.target.trim() : '';
    if (!action || !target || action.length > 200 || target.length > 500) {
      return apiError('Valid action and target are required.', 400);
    }

    const log = {
      id: crypto.randomUUID(),
      user_id: auth.user.id,
      email: auth.user.email,
      action: `${action} — ${target}`
    };
    const { error } = await supabase.from('zoal_activity_logs').insert(log);
    if (error) return apiError(error.message, 500);

    return apiResponse({ log });
  } catch (err: any) {
    return apiError(err.message || 'Failed to record staff activity', 500);
  }
}
