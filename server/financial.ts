import { Request, Response } from 'express';
import { getServiceSupabaseClient } from './supabase';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    role?: string;
    email?: string;
    [key: string]: unknown;
  } | null;
};

const FINANCIAL_ROLES = new Set(['owner', 'admin', 'manager']);

function requireFinancialAccess(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    return false;
  }
  if (!FINANCIAL_ROLES.has(req.user.role || '')) {
    res.status(403).json({ error: 'Forbidden', message: 'Financial access is restricted.' });
    return false;
  }
  return true;
}

export async function getFinancialIntelligence(req: AuthenticatedRequest, res: Response) {
  if (!requireFinancialAccess(req, res)) return;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const start = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const end = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    let ordersQuery = supabase
      .from('zoal_orders')
      .select('id,total_amount,tax_amount,shipping_cost,created_at,status,payment_status')
      .in('status', ['completed', 'delivered'])
      .in('payment_status', ['paid', 'captured', 'completed']);
    if (start) ordersQuery = ordersQuery.gte('created_at', start);
    if (end) ordersQuery = ordersQuery.lte('created_at', end);

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) return res.status(500).json({ error: 'Failed to read authoritative orders.' });

    const orderIds = (orders || []).map((order: any) => order.id);
    let items: any[] = [];
    if (orderIds.length) {
      const { data, error } = await supabase
        .from('zoal_order_items')
        .select('order_id,quantity,unit_cost')
        .in('order_id', orderIds);
      if (error) return res.status(500).json({ error: 'Failed to read authoritative order costs.' });
      items = data || [];
    }

    const missingCostItems = items.filter((item: any) => item.unit_cost === null || item.unit_cost === undefined);
    const cogs = items.reduce((sum: number, item: any) => sum + (item.unit_cost == null ? 0 : Number(item.unit_cost) * Number(item.quantity || 0)), 0);

    let expensesQuery = supabase.from('zoal_financial_expenses').select('amount,expense_date,status');
    if (start) expensesQuery = expensesQuery.gte('expense_date', start.slice(0, 10));
    if (end) expensesQuery = expensesQuery.lte('expense_date', end.slice(0, 10));
    const { data: expenses, error: expensesError } = await expensesQuery;
    if (expensesError) return res.status(500).json({ error: 'Failed to read authoritative expenses.' });

    const operatingExpenses = (expenses || [])
      .filter((expense: any) => !expense.status || ['approved', 'posted', 'paid'].includes(String(expense.status).toLowerCase()))
      .reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);

    const revenue = (orders || []).reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);
    const tax = (orders || []).reduce((sum: number, order: any) => sum + Number(order.tax_amount || 0), 0);
    const shippingRevenue = (orders || []).reduce((sum: number, order: any) => sum + Number(order.shipping_cost || 0), 0);
    const grossProfit = revenue - tax - cogs;
    const operatingProfit = grossProfit - operatingExpenses;
    const complete = missingCostItems.length === 0;

    return res.json({
      source: 'authoritative',
      period: { start: start || null, end: end || null },
      revenue: Number(revenue.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shippingRevenue: Number(shippingRevenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      operatingExpenses: Number(operatingExpenses.toFixed(2)),
      grossProfit: complete ? Number(grossProfit.toFixed(2)) : null,
      operatingProfit: complete ? Number(operatingProfit.toFixed(2)) : null,
      grossMargin: complete && revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(2)) : null,
      operatingMargin: complete && revenue > 0 ? Number(((operatingProfit / revenue) * 100).toFixed(2)) : null,
      orderCount: orders?.length || 0,
      expenseCount: expenses?.length || 0,
      dataQuality: {
        complete,
        missingCostItemCount: missingCostItems.length,
        orderItemCount: items.length,
        profitMetricsSuppressed: !complete
      }
    });
  } catch (error) {
    console.error('Financial Intelligence Error:', error);
    return res.status(500).json({ error: 'Internal Server Error during financial analysis.' });
  }
}
