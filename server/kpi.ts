import { getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';

const ALLOWED_KPI_NAMES = [
  'Revenue', 'Orders', 'AOV', 'Customers', 'CAC', 'DAU', 
  'Latency', 'Order Dispatch Latency (Hrs)', 'Customer Acquisition Cost (CAC)', 
  'Average Order Value (AOV)', 'Daily Active Users (DAU)',
  'Profit', 'Margin', 'Refund Rate'
];

export async function getKpiData(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const { range = 'yearly' } = req.query;
    
    // Calculate date filter based on range
    let startDate = new Date();
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'yearly':
      default:
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // 1. Fetch Authoritative Data
    // We only count orders that are 'paid', 'processing', 'shipped', 'delivered', or 'partially_refunded' as revenue source.
    const VALID_REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'partially_refunded'];
    
    const { data: orders, error: ordersError } = await supabase
      .from('zoal_orders')
      .select('id, total_amount, status, created_at')
      .gte('created_at', startDate.toISOString())
      .in('status', VALID_REVENUE_STATUSES);
    
    // Fetch Refunds for the same orders to ensure Refund-Aware Revenue
    const orderIds = orders?.map(o => o.id) || [];
    let totalRefunds = 0;
    if (orderIds.length > 0) {
      const { data: payments, error: paymentsError } = await supabase
        .from('zoal_payment_transactions')
        .select('refund_amount')
        .in('order_id', orderIds);
      
      if (!paymentsError) {
        totalRefunds = payments?.reduce((sum, p) => sum + Number(p.refund_amount || 0), 0) || 0;
      }
    }

    // Authoritative Customer Count (excluding staff/admin)
    const { count: customerCount, error: usersError } = await supabase
      .from('zoal_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // Best Effort CAC (Ads Spend / New Customers in period)
    const { data: growthReports } = await supabase
      .from('zoal_growth_reports')
      .select('ads_spend')
      .gte('captured_at', startDate.toISOString());
    
    const { count: newCustomersCount } = await supabase
      .from('zoal_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', startDate.toISOString());

    // Best Effort DAU (Distinct active users in last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: activeLogs } = await supabase
      .from('zoal_activity_logs')
      .select('user_id')
      .gte('timestamp', oneDayAgo);
    
    const distinctActiveUsers = new Set(activeLogs?.map(l => l.user_id).filter(Boolean)).size;

    const { data: targets, error: targetsError } = await supabase.from('zoal_kpi_targets').select('*');
    
    if (ordersError || targetsError || usersError) {
      console.error('KPI Data Fetch Error:', { ordersError, targetsError, usersError });
      return res.status(500).json({ error: 'Failed to fetch KPI source data.' });
    }

    // 2. Calculate Authoritative Metrics
    const grossRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const netRevenue = Math.max(0, grossRevenue - totalRefunds);
    const orderCount = orders?.length || 0;
    const aov = orderCount > 0 ? netRevenue / orderCount : 0;
    
    // Revenue by month (last 6 months)
    const monthlyRevenue: Record<string, number> = {};
    orders?.forEach(o => {
      const month = new Date(o.created_at).toLocaleString('default', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(o.total_amount);
    });

    // Calculate CAC
    const totalAdsSpend = growthReports?.reduce((sum, r) => sum + Number(r.ads_spend || 0), 0) || 0;
    const cac = (newCustomersCount && newCustomersCount > 0) ? (totalAdsSpend / newCustomersCount) : -1;

    // 3. Construct Snapshots (Live & Historical)
    const { data: historicalSnapshots } = await supabase
      .from('zoal_kpi_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(50);

    const UNAVAILABLE = -1;

    const liveSnapshots = [
      { metric_name: 'Revenue', value: netRevenue, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Orders', value: orderCount, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'AOV', value: aov, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Customers', value: customerCount || 0, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'CAC', value: cac > 0 ? cac : UNAVAILABLE, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'DAU', value: distinctActiveUsers > 0 ? distinctActiveUsers : UNAVAILABLE, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Latency', value: UNAVAILABLE, period: range, captured_at: new Date().toISOString() }
    ];

    res.json({ 
      snapshots: [...liveSnapshots, ...(historicalSnapshots || [])], 
      targets,
      live: {
        totalRevenue: netRevenue,
        orderCount,
        aov,
        customerCount,
        monthlyRevenue,
        unavailable_metrics: ['Latency', 'Profit', 'Margin']
      }
    });
  } catch (err) {
    console.error('KPI Error:', err);
    res.status(500).json({ error: 'Internal Server Error during KPI calculation.' });
  }
}

export async function setKpiTarget(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  const { metric_name, target_value, deadline, id } = req.body;

  // Strict Validation
  if (!metric_name || typeof metric_name !== 'string' || !ALLOWED_KPI_NAMES.some(name => metric_name.includes(name))) {
    return res.status(400).json({ error: 'Invalid or unauthorized metric_name.' });
  }
  if (target_value === undefined || typeof target_value !== 'number' || target_value < 0 || !isFinite(target_value)) {
    return res.status(400).json({ error: 'Invalid target_value. Must be a non-negative number.' });
  }
  if (deadline && isNaN(Date.parse(deadline))) {
    return res.status(400).json({ error: 'Invalid deadline date format.' });
  }

  const payload: any = { metric_name, target_value, deadline };
  if (id) payload.id = id;

  const { data, error } = await supabase.from('zoal_kpi_targets').upsert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function deleteKpiTarget(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Target ID is required.' });

  const { error } = await supabase.from('zoal_kpi_targets').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
}
