import { createClient } from '@supabase/supabase-js';

const ROLLING_MONTHS = 6;
const DEFAULT_SUPABASE_URL = 'https://jglveforpqhioxpambbq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';

const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim() || 'unknown';
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimit(req: any, res: any): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  let entry = rateLimitCache.get(ip);
  if (!entry || now >= entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_WINDOW_MS };
  }
  entry.count += 1;
  rateLimitCache.set(ip, entry);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
  if (entry.count > RATE_LIMIT) {
    res.status(429).json({ error: 'Too Many Requests' });
    return false;
  }
  return true;
}

function getSupabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
}

function getServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!rateLimit(req, res)) return;

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const token = authHeader.slice(7).trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });

  const url = getSupabaseUrl();
  const serviceKey = getServiceKey();
  if (!serviceKey) {
    return res.status(503).json({ error: 'Dashboard analytics database is unavailable.' });
  }

  try {
    // Verify the caller directly with Supabase Auth. This avoids importing the Express
    // middleware stack into a standalone Vercel Function while preserving server authority.
    const authResponse = await fetch(`${url}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    if (!authResponse.ok) return res.status(401).json({ error: 'Unauthorized', message: 'Session expired or invalid token.' });

    const authUser = await authResponse.json();
    if (!authUser?.id) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid authenticated user.' });

    const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile, error: profileError } = await adminClient
      .from('zoal_users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const allowedRoles = new Set(['admin', 'owner', 'manager']);
    if (!profile?.role || !allowedRoles.has(profile.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Insufficient role for dashboard analytics.' });
    }

    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ROLLING_MONTHS - 1), 1));

    const [customersResult, staffResult, productsResult, categoriesResult, totalOrdersResult, allRevenueResult, ordersResult, inventoryResult, productsWithCategoriesResult] = await Promise.all([
      adminClient.from('zoal_users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      adminClient.from('zoal_users').select('id', { count: 'exact', head: true }).in('role', ['staff', 'manager', 'admin', 'owner']),
      adminClient.from('zoal_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      adminClient.from('zoal_categories').select('id, name').order('name', { ascending: true }),
      adminClient.from('zoal_orders').select('id', { count: 'exact', head: true }),
      adminClient.from('zoal_orders').select('total_amount').eq('payment_status', 'paid').neq('status', 'Cancelled'),
      adminClient.from('zoal_orders').select('id, customer_id, status, total_amount, payment_status, created_at').gte('created_at', trendStart.toISOString()).lt('created_at', nextMonthStart.toISOString()),
      adminClient.from('zoal_inventory').select('quantity, min_stock, low_stock_threshold'),
      adminClient.from('zoal_products').select('category_id').eq('is_active', true)
    ]);

    const failed = [customersResult, staffResult, productsResult, categoriesResult, totalOrdersResult, allRevenueResult, ordersResult, inventoryResult, productsWithCategoriesResult].find((result: any) => result.error);
    if (failed?.error) throw failed.error;

    const orders = ordersResult.data || [];
    const revenueOrders = orders.filter((order: any) => order.payment_status === 'paid' && order.status !== 'Cancelled');
    const totalRevenue = (allRevenueResult.data || []).reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);
    const monthlySales = revenueOrders
      .filter((order: any) => new Date(order.created_at) >= currentMonthStart && new Date(order.created_at) < nextMonthStart)
      .reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);

    const revenueTrendData = Array.from({ length: ROLLING_MONTHS }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ROLLING_MONTHS - 1 - index), 1));
      const key = monthKey(date);
      const monthOrders = revenueOrders.filter((order: any) => monthKey(new Date(order.created_at)) === key);
      return {
        name: monthLabel(date),
        sales: monthOrders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0),
        orders: monthOrders.length
      };
    });

    const categoryCountMap: Record<string, number> = {};
    (productsWithCategoriesResult.data || []).forEach((product: any) => {
      if (product.category_id) categoryCountMap[product.category_id] = (categoryCountMap[product.category_id] || 0) + 1;
    });
    const categoryPerformanceData = (categoriesResult.data || [])
      .map((category: any) => ({ name: category.name, value: categoryCountMap[category.id] || 0 }))
      .filter((category: any) => category.value > 0);

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

    return res.status(200).json({
      metrics: {
        totalRevenue,
        monthlySales,
        totalOrders: totalOrdersResult.count || 0,
        totalCustomers: customersResult.count || 0,
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
    return res.status(500).json({ error: 'Dashboard analytics unavailable.' });
  }
}
