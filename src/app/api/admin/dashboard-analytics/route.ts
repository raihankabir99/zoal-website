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

    const [customersResult, staffResult, productsResult, categoriesResult, totalOrdersResult, allRevenueResult, ordersResult, inventoryResult] = await Promise.all([
      supabase.from('zoal_users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('zoal_users').select('id', { count: 'exact', head: true }).in('role', ['staff', 'manager', 'admin', 'owner']),
      supabase.from('zoal_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('zoal_categories').select('id, name').order('name', { ascending: true }),
      supabase.from('zoal_orders').select('id', { count: 'exact', head: true }),
      supabase.from('zoal_orders').select('total_amount').eq('payment_status', 'paid').neq('status', 'Cancelled'),
      supabase
        .from('zoal_orders')
        .select('id, customer_id, status, total_amount, payment_status, created_at')
        .gte('created_at', trendStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString()),
      supabase.from('zoal_inventory').select('quantity, min_stock, low_stock_threshold')
    ]);

    if (customersResult.error) throw customersResult.error;
    if (staffResult.error) throw staffResult.error;
    if (productsResult.error) throw productsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (totalOrdersResult.error) throw totalOrdersResult.error;
    if (allRevenueResult.error) throw allRevenueResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (inventoryResult.error) throw inventoryResult.error;

    const orders = ordersResult.data || [];
    const revenueOrders = orders.filter((order: any) => order.payment_status === 'paid' && order.status !== 'Cancelled');
    const totalRevenue = (allRevenueResult.data || []).reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);
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

    const categoryCountMap: Record<string, number> = {};
    const { data: productsWithCategories, error: productCategoryError } = await supabase
      .from('zoal_products')
      .select('category_id')
      .eq('is_active', true);
    if (productCategoryError) throw productCategoryError;

    (productsWithCategories || []).forEach((product: any) => {
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

    const uniqueCustomers = new Set(orders.map((order: any) => order.customer_id).filter(Boolean)).size;

    return apiResponse({
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
      revenueTrendData: trendMonths,
      categoryPerformanceData
    });
  } catch (err: any) {
    console.error('Dashboard analytics error:', err);
    return apiError(err.message || 'Dashboard analytics unavailable', 500);
  }
}
