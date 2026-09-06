import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabaseClient, getSupabaseClient } from '../../backend/supabase.ts';
import { authenticateRequest, requireRole, rateLimiterMiddleware } from '../../backend/security.ts';

const ROLLING_MONTHS = 6;
const rateLimiter = rateLimiterMiddleware(120, 15 * 60 * 1000);

async function runMiddleware(req: any, res: any, middleware: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const next = () => { if (!finished) { finished = true; resolve(true); } };
    try {
      middleware(req, res, next);
      if (res.writableEnded && !finished) { finished = true; resolve(false); }
    } catch (error) {
      if (!finished) { finished = true; reject(error); }
    }
  });
}

async function runAuthMiddleware(req: any, res: any, middleware: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const next = () => { if (!finished) { finished = true; resolve(true); } };
    try {
      Promise.resolve(middleware(req, res, next)).catch((error) => {
        if (!finished) { finished = true; reject(error); }
      });
      if (res.writableEnded && !finished) { finished = true; resolve(false); }
    } catch (error) {
      if (!finished) { finished = true; reject(error); }
    }
  });
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const rateLimitPassed = await runMiddleware(req, res, rateLimiter);
  if (!rateLimitPassed || res.writableEnded) return;

  const authenticated = await runAuthMiddleware(req, res, authenticateRequest);
  if (!authenticated || res.writableEnded) return;

  const authorized = await runAuthMiddleware(req, res, requireRole(['admin', 'owner', 'manager']));
  if (!authorized || res.writableEnded) return;

  const supabase = getServiceSupabaseClient() || getSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Dashboard analytics database is unavailable.' });

  try {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ROLLING_MONTHS - 1), 1));

    const [customersResult, staffResult, productsResult, categoriesResult, totalOrdersResult, allRevenueResult, ordersResult, inventoryResult] = await Promise.all([
      supabase.from('zoal_users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('zoal_users').select('id', { count: 'exact', head: true }).in('role', ['staff', 'manager', 'admin', 'owner']),
      supabase.from('zoal_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('zoal_categories').select('id, name').order('name', { ascending: true }),
      supabase.from('zoal_orders').select('id', { count: 'exact', head: true }),
      supabase.from('zoal_orders').select('total_amount').eq('payment_status', 'paid').neq('status', 'Cancelled'),
      supabase.from('zoal_orders').select('id, customer_id, status, total_amount, payment_status, created_at').gte('created_at', trendStart.toISOString()).lt('created_at', nextMonthStart.toISOString()),
      supabase.from('zoal_inventory').select('quantity, min_stock, low_stock_threshold')
    ]);

    const failed = [customersResult, staffResult, productsResult, categoriesResult, totalOrdersResult, allRevenueResult, ordersResult, inventoryResult].find((result: any) => result.error);
    if (failed?.error) throw failed.error;

    const orders = ordersResult.data || [];
    const revenueOrders = orders.filter((order: any) => order.payment_status === 'paid' && order.status !== 'Cancelled');
    const totalRevenue = (allRevenueResult.data || []).reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);
    const monthlySales = revenueOrders.filter((order: any) => new Date(order.created_at) >= currentMonthStart && new Date(order.created_at) < nextMonthStart).reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);

    const revenueTrendData = Array.from({ length: ROLLING_MONTHS }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ROLLING_MONTHS - 1 - index), 1));
      const key = monthKey(date);
      const monthOrders = revenueOrders.filter((order: any) => monthKey(new Date(order.created_at)) === key);
      return { name: monthLabel(date), sales: monthOrders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0), orders: monthOrders.length };
    });

    const { data: productsWithCategories, error: productCategoryError } = await supabase.from('zoal_products').select('category_id').eq('is_active', true);
    if (productCategoryError) throw productCategoryError;

    const categoryCountMap: Record<string, number> = {};
    (productsWithCategories || []).forEach((product: any) => {
      if (product.category_id) categoryCountMap[product.category_id] = (categoryCountMap[product.category_id] || 0) + 1;
    });
    const categoryPerformanceData = (categoriesResult.data || []).map((category: any) => ({ name: category.name, value: categoryCountMap[category.id] || 0 })).filter((category: any) => category.value > 0);

    const statusCounts = orders.reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const inventory = inventoryResult.data || [];
    const lowStockCount = inventory.filter((row: any) => {
      const quantity = Number(row.quantity || 0);
      const threshold = Number(row.low_stock_threshold ?? row.min_stock ?? 0);
      return quantity > 0 && threshold > 0 && quantity <= threshold;
    }).length;
    const outOfStockCount = inventory.filter((row: any) => Number(row.quantity || 0) <= 0).length;
    const uniqueCustomers = new Set(orders.map((order: any) => order.customer_id).filter(Boolean)).size;

    return res.status(200).json({
      metrics: {
        totalRevenue,
        monthlySales,
        totalOrders: totalOrdersResult.count || 0,
        totalCustomers: customersResult.count ?? uniqueCustomers,
        totalStaff: staffResult.count || 0,
        totalProductsCount: productsResult.count || 0,
        pendingOrders: statusCounts.Pending || 0,
        preparingOrders: statusCounts.Preparing || 0,
        shippedOrders: statusCounts.Shipped || 0,
        deliveredOrders: statusCounts.Completed || 0,
        cancelledOrders: statusCounts.Cancelled || 0,
        lowStockCount,
        outOfStockCount
      },
      revenueTrendData,
      categoryPerformanceData
    });
  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    return res.status(500).json({ error: error?.message || 'Dashboard analytics unavailable' });
  }
}
