import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getKpiData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

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
    // We only count orders that are 'paid', 'processing', 'shipped', or 'delivered' as revenue.
    // 'partially_refunded' is included but ideally we'd subtract refunds if the schema supported fine-grained refund amounts easily.
    const VALID_REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'partially_refunded'];
    
    const { data: orders, error: ordersError } = await supabase
      .from('zoal_orders')
      .select('total_amount, status, created_at')
      .gte('created_at', startDate.toISOString())
      .in('status', VALID_REVENUE_STATUSES);
    
    // Authoritative Customer Count (excluding staff/admin)
    const { count: customerCount, error: usersError } = await supabase
      .from('zoal_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    const { data: targets, error: targetsError } = await supabase.from('zoal_kpi_targets').select('*');
    
    if (ordersError || targetsError || usersError) {
      console.error('KPI Data Fetch Error:', { ordersError, targetsError, usersError });
      return res.status(500).json({ error: 'Failed to fetch KPI source data.' });
    }

    // 2. Calculate Authoritative Metrics
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const orderCount = orders?.length || 0;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    // Revenue by month (last 6 months)
    const monthlyRevenue: Record<string, number> = {};
    orders?.forEach(o => {
      const month = new Date(o.created_at).toLocaleString('default', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(o.total_amount);
    });

    // 3. Construct Snapshots (Live & Historical)
    const { data: historicalSnapshots } = await supabase
      .from('zoal_kpi_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(50);

    // Marked as "Unavailable" as authoritative source data (spend/telemetry) is not yet in schema
    const UNAVAILABLE = -1; // UI will handle -1 as "Not Available"

    const liveSnapshots = [
      { metric_name: 'Revenue', value: totalRevenue, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Orders', value: orderCount, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'AOV', value: aov, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Customers', value: customerCount || 0, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'CAC', value: UNAVAILABLE, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'DAU', value: UNAVAILABLE, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Latency', value: UNAVAILABLE, period: range, captured_at: new Date().toISOString() }
    ];

    res.json({ 
      snapshots: [...liveSnapshots, ...(historicalSnapshots || [])], 
      targets,
      live: {
        totalRevenue,
        orderCount,
        aov,
        customerCount,
        monthlyRevenue,
        unavailable_metrics: ['CAC', 'DAU', 'Latency', 'Profit', 'Margin']
      }
    });
  } catch (err) {
    console.error('KPI Error:', err);
    res.status(500).json({ error: 'Internal Server Error during KPI calculation.' });
  }
}

export async function setKpiTarget(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { metric_name, target_value, deadline, id } = req.body;

  // Strict Validation
  if (!metric_name || typeof metric_name !== 'string') {
    return res.status(400).json({ error: 'Invalid metric_name.' });
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
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Target ID is required.' });

  const { error } = await supabase.from('zoal_kpi_targets').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
}
