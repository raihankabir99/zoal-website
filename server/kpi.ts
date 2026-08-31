import { getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';

const ALLOWED_KPI_NAMES = [
  'Revenue', 'Orders', 'AOV', 'Customers', 'CAC', 'DAU',
  'Latency', 'Profit', 'Margin', 'Refund Rate'
];

function getRangeStart(range: unknown): Date {
  const start = new Date();
  switch (range) {
    case 'today': start.setHours(0, 0, 0, 0); break;
    case 'week': start.setDate(start.getDate() - 7); break;
    case 'month': start.setMonth(start.getMonth() - 1); break;
    case 'quarter': start.setMonth(start.getMonth() - 3); break;
    case 'yearly':
    default: start.setFullYear(start.getFullYear() - 1); break;
  }
  return start;
}

export async function getKpiData(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const { range = 'yearly' } = req.query;
    const startDate = getRangeStart(range);
    const endDate = new Date();

    const { data: core, error: coreError } = await supabase.rpc('zoal_business_insights_core_stats', {
      p_start: startDate.toISOString(),
      p_end: endDate.toISOString()
    });

    if (coreError) {
      console.error('KPI Core Aggregation Error:', coreError);
      return res.status(500).json({ error: 'Failed to fetch KPI source data.' });
    }

    const { data: regional, error: regionalError } = await supabase.rpc('zoal_business_insights_regional', {
      p_start: startDate.toISOString(),
      p_end: endDate.toISOString()
    });

    if (regionalError) {
      console.error('KPI Regional Aggregation Error:', regionalError);
      return res.status(500).json({ error: 'Failed to fetch KPI regional data.' });
    }

    const { data: targets, error: targetsError } = await supabase.from('zoal_kpi_targets').select('*');
    if (targetsError) {
      console.error('KPI Targets Error:', targetsError);
      return res.status(500).json({ error: 'Failed to fetch KPI targets.' });
    }

    const totalRevenue = Number(core?.totalRevenue || 0);
    const orderCount = Number(core?.totalOrders || 0);
    const aov = Number(core?.averageOrderValue || 0);
    const customerCount = Number(core?.activeCustomers || 0);
    const lowStockCount = Number(core?.lowStockCount || 0);

    const liveSnapshots = [
      { metric_name: 'Revenue', value: totalRevenue, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Orders', value: orderCount, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'AOV', value: aov, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Customers', value: customerCount, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'CAC', value: -1, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'DAU', value: -1, period: range, captured_at: new Date().toISOString() },
      { metric_name: 'Latency', value: -1, period: range, captured_at: new Date().toISOString() }
    ];

    const { data: historicalSnapshots } = await supabase
      .from('zoal_kpi_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(50);

    const monthlyRevenue: Record<string, number> = {};
    // Monthly trend is intentionally left empty here rather than performing an unbounded JS aggregation.
    // A dedicated SQL trend RPC can be added as a P2 optimization without compromising core KPI correctness.

    res.json({
      snapshots: [...liveSnapshots, ...(historicalSnapshots || [])],
      targets,
      live: {
        totalRevenue,
        orderCount,
        aov,
        customerCount,
        lowStockCount,
        monthlyRevenue,
        regional: (regional || []).map((row: any) => ({
          region: row.region,
          revenue: Number(row.revenue || 0),
          orderCount: Number(row.order_count || 0)
        })),
        unavailable_metrics: ['CAC', 'DAU', 'Latency', 'Profit', 'Margin'],
        revenueStatusBasis: core?.revenueStatusBasis,
        profitStatus: core?.profitStatus
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
  if (!metric_name || typeof metric_name !== 'string' || !ALLOWED_KPI_NAMES.includes(metric_name)) {
    return res.status(400).json({ error: 'Invalid or unauthorized metric_name. Must be one of: ' + ALLOWED_KPI_NAMES.join(', ') });
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
