import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole } from '../../helpers';

const ROLLING_MONTHS = 6;

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}

export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['admin', 'owner', 'manager']);
    if (auth.error) return auth.error;

    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ROLLING_MONTHS - 1), 1));

    const [
      customersResult,
      staffResult,
      productsResult,
      categoriesResult,
      ordersResult
    ] = await Promise.all([
      supabase.from('zoal_users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('zoal_users').select('id', { count: 'exact', head: true }).neq('role', 'customer'),
      supabase.from('zoal_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('zoal_categories').select('id, name').order('name', { ascending: true }),
      supabase
        .from('zoal_orders')
        .select('id, customer_id, status, total_amount, payment_status, created_at')
        .gte('created_at', trendStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())
    ]);

    if (customersResult.error) throw customersResult.error;
    if (staffResult.error) throw staffResult.error;
    if (productsResult.error) throw productsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (ordersResult.error) throw ordersResult.error;

    const orders = ordersResult.data || [];
    const revenueOrders = orders.filter(
      (order: any) => order.payment_status === 'paid' && order.status !== 'Cancelled'
    );

    const totalRevenue = revenueOrders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);
    const monthlySales = revenueOrders
      .filter((order: any) => new Date(order.created_at) >= currentMonthStart && new Date(order.created_at) < nextMonthStart)
      .reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);

    const trendMonths = Array.from({ length: ROLLING_MONTHS }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ROLLING_MONTHS - 1 - index), 1));
      const key = monthKey(date);
      const monthOrders = revenueOrders.filter((order: any) => monthKey(new Date(order.created_at)) === key);
      return {
        name: monthLabel(date),
        sales: monthOrders.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0),
        orders: monthOrders.length
      };
    });

    const categoryIds = (productsResult.data || []).map((product: any) => product.id);
    const { data: productsWithCategories, error: productCategoryError } = await supabase
      .from('zoal_products')
      .select('category_id')
      .eq('is_active', true);
    if (productCategoryError) throw productCategoryError;

    const categoryCountMap: Record<string, number> = {};
    (productsWithCategories || []).forEach((product: any) => {
      if (product.category_id) categoryCountMap[product.category_id] = (categoryCountMap[product.category_id] || 0) + 1;
    });

    const categoryPerformanceData = (categoriesResult.data || [])
      .map((category: any) => ({
        name: category.name,
        value: categoryCountMap[category.id] || 0
      }))
      .filter((category: any) => category.value > 0);

    const statusCounts = orders.reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const uniqueCustomers = new Set(
      orders.map((order: any) => order.customer_id).filter(Boolean)
    ).size;

    return apiResponse({
      metrics: {
        totalRevenue,
        monthlySales,
        totalOrders: orders.length,
        totalCustomers: customersResult.count || uniqueCustomers,
        totalStaff: staffResult.count || 0,
        totalProductsCount: productsResult.count || 0,
        pendingOrders: statusCounts.Pending || 0,
        preparingOrders: statusCounts.Preparing || 0,
        shippedOrders: statusCounts.Shipped || 0,
        deliveredOrders: statusCounts.Completed || 0,
        cancelledOrders: statusCounts.Cancelled || 0,
        lowStockCount: 0,
        outOfStockCount: 0
      },
      revenueTrendData: trendMonths,
      categoryPerformanceData
    });
  } catch (err: any) {
    console.error('Dashboard analytics error:', err);
    return apiError(err.message || 'Dashboard analytics unavailable', 500);
  }
}
