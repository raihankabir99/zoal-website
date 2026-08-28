import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getKpiData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  try {
    // 1. Fetch Real Data for Aggregation
    const { data: orders, error: ordersError } = await supabase
      .from('zoal_orders')
      .select('total_amount, status, created_at');
    
    const { count: customerCount, error: usersError } = await supabase
      .from('zoal_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    const { data: targets, error: targetsError } = await supabase.from('zoal_kpi_targets').select('*');
    
    if (ordersError || targetsError || usersError) {
      console.error('KPI Data Fetch Error:', { ordersError, targetsError, usersError });
      return res.status(500).json({ error: 'Failed to fetch KPI source data.' });
    }

    // 2. Calculate Live Metrics
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const orderCount = orders.length;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    // Revenue by month (last 6 months)
    const monthlyRevenue: Record<string, number> = {};
    orders.forEach(o => {
      const month = new Date(o.created_at).toLocaleString('default', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(o.total_amount);
    });

    // 3. Construct Snapshots (Live & Historical)
    // We return both live calculated metrics and any stored historical snapshots
    const { data: historicalSnapshots } = await supabase
      .from('zoal_kpi_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(50);

    const liveSnapshots = [
      { metric_name: 'Revenue', value: totalRevenue, period: 'Yearly', captured_at: new Date().toISOString() },
      { metric_name: 'Orders', value: orderCount, period: 'Yearly', captured_at: new Date().toISOString() },
      { metric_name: 'AOV', value: aov, period: 'Yearly', captured_at: new Date().toISOString() },
      { metric_name: 'Customers', value: customerCount || 0, period: 'Yearly', captured_at: new Date().toISOString() }
    ];

    res.json({ 
      snapshots: [...liveSnapshots, ...(historicalSnapshots || [])], 
      targets,
      live: {
        totalRevenue,
        orderCount,
        aov,
        customerCount,
        monthlyRevenue
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

  const { data, error } = await supabase.from('zoal_kpi_targets').upsert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}
