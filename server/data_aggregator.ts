import { getServiceSupabaseClient } from './supabase';

export async function getCoreBusinessStats(startDate?: string, endDate?: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) throw new Error('Supabase service client not initialized.');

  const { data, error } = await supabase.rpc('zoal_business_insights_core_stats', {
    p_start: startDate ?? null,
    p_end: endDate ?? null
  });

  if (error) throw new Error(`Business Insights core stats query failed: ${error.message}`);

  return data ?? {
    totalOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    averageOrderValue: 0,
    lowStockCount: 0,
    revenueStatusBasis: 'paid_non_cancelled_non_refunded',
    profitStatus: 'not_available_without_authoritative_cogs'
  };
}
