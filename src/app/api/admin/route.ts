import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole } from '../helpers';

/**
 * GET /api/admin
 * Admin Overview KPIs and server telemetry dashboards.
 * RBAC: Admin access only.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['admin']);
    if (auth.error) return auth.error;

    // Fetch store metrics
    const { count: totalCustomers } = await supabase
      .from('zoal_users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer');

    const { count: totalOrders } = await supabase
      .from('zoal_orders')
      .select('id', { count: 'exact', head: true });

    const { data: revenueData } = await supabase
      .from('zoal_orders')
      .select('total_amount')
      .eq('payment_status', 'paid');

    const totalRevenue = (revenueData || []).reduce((acc, curr) => acc + Number(curr.total_amount), 0);

    const { data: latestLogs } = await supabase
      .from('zoal_activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    return apiResponse({
      kpis: {
        totalCustomers: totalCustomers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
      },
      latestLogs: latestLogs || []
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
