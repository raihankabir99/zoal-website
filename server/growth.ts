import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

const VALID_REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function periodBounds(req: Request) {
  const now = new Date();
  const requestedStart = parseDate(req.query.startDate);
  const requestedEnd = parseDate(req.query.endDate);

  if (requestedStart && requestedEnd && requestedStart < requestedEnd) {
    return { start: requestedStart, end: requestedEnd };
  }

  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 30);
  return { start, end: now };
}

function previousPeriodBounds(start: Date, end: Date) {
  const duration = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start),
  };
}

function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

async function getLiveGrowthAnalytics(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { start, end } = periodBounds(req);
  const previous = previousPeriodBounds(start, end);

  const currentStart = start.toISOString();
  const currentEnd = end.toISOString();
  const previousStart = previous.start.toISOString();
  const previousEnd = previous.end.toISOString();

  const currentOrdersQuery = supabase
    .from('zoal_orders')
    .select('id,total_amount,status', { count: 'exact' })
    .in('status', VALID_REVENUE_STATUSES)
    .gte('created_at', currentStart)
    .lt('created_at', currentEnd);

  const previousOrdersQuery = supabase
    .from('zoal_orders')
    .select('id,total_amount,status', { count: 'exact' })
    .in('status', VALID_REVENUE_STATUSES)
    .gte('created_at', previousStart)
    .lt('created_at', previousEnd);

  const currentCustomersQuery = supabase
    .from('zoal_users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', currentStart)
    .lt('created_at', currentEnd);

  const previousCustomersQuery = supabase
    .from('zoal_users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', previousStart)
    .lt('created_at', previousEnd);

  const [currentOrders, previousOrders, currentCustomers, previousCustomers] = await Promise.all([
    currentOrdersQuery,
    previousOrdersQuery,
    currentCustomersQuery,
    previousCustomersQuery,
  ]);

  const queryErrors = [
    currentOrders.error,
    previousOrders.error,
    currentCustomers.error,
    previousCustomers.error,
  ].filter(Boolean);

  if (queryErrors.length) {
    return res.status(500).json({
      error: 'Failed to calculate live growth analytics.',
      details: queryErrors[0]?.message,
    });
  }

  const currentRevenue = (currentOrders.data ?? []).reduce(
    (sum, order) => sum + Number(order.total_amount ?? 0),
    0,
  );
  const previousRevenue = (previousOrders.data ?? []).reduce(
    (sum, order) => sum + Number(order.total_amount ?? 0),
    0,
  );

  const currentOrderCount = currentOrders.count ?? 0;
  const previousOrderCount = previousOrders.count ?? 0;
  const currentCustomerCount = currentCustomers.count ?? 0;
  const previousCustomerCount = previousCustomers.count ?? 0;

  return res.json({
    mode: 'live',
    period: { start: currentStart, end: currentEnd },
    previousPeriod: { start: previousStart, end: previousEnd },
    revenue: Number(currentRevenue.toFixed(2)),
    orders: currentOrderCount,
    newRegisteredCustomers: currentCustomerCount,
    averageOrderValue: currentOrderCount > 0 ? Number((currentRevenue / currentOrderCount).toFixed(2)) : 0,
    revenueGrowth: growthPercent(currentRevenue, previousRevenue),
    orderGrowth: growthPercent(currentOrderCount, previousOrderCount),
    customerGrowth: growthPercent(currentCustomerCount, previousCustomerCount),
    revenueStatusBasis: VALID_REVENUE_STATUSES,
    generatedAt: new Date().toISOString(),
  });
}

export async function getGrowthReports(req: Request, res: Response) {
  if (req.query.mode === 'live') {
    return getLiveGrowthAnalytics(req, res);
  }

  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_growth_reports').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
