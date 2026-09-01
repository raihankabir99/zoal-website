-- ZOAL Financial Intelligence P1/P2 remediation
-- Add a controlled operating-expense ledger and extend the authoritative financial RPC.
-- Historical costs remain NULL when unavailable; never fabricate them.

CREATE TABLE IF NOT EXISTS public.zoal_financial_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  category TEXT NOT NULL CHECK (length(trim(category)) > 0),
  description TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft','posted','void')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zoal_financial_expenses_date_status
  ON public.zoal_financial_expenses(expense_date, status);

ALTER TABLE public.zoal_financial_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_expenses_owner_admin_select" ON public.zoal_financial_expenses;
CREATE POLICY "finance_expenses_owner_admin_select"
  ON public.zoal_financial_expenses
  FOR SELECT TO authenticated
  USING (public.get_auth_user_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "finance_expenses_owner_admin_insert" ON public.zoal_financial_expenses;
CREATE POLICY "finance_expenses_owner_admin_insert"
  ON public.zoal_financial_expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.get_auth_user_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "finance_expenses_owner_admin_update" ON public.zoal_financial_expenses;
CREATE POLICY "finance_expenses_owner_admin_update"
  ON public.zoal_financial_expenses
  FOR UPDATE TO authenticated
  USING (public.get_auth_user_role() IN ('owner','admin'))
  WITH CHECK (public.get_auth_user_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "finance_expenses_owner_admin_delete" ON public.zoal_financial_expenses;
CREATE POLICY "finance_expenses_owner_admin_delete"
  ON public.zoal_financial_expenses
  FOR DELETE TO authenticated
  USING (public.get_auth_user_role() IN ('owner','admin'));

COMMENT ON TABLE public.zoal_financial_expenses IS
  'Authoritative operating expense ledger for Financial Intelligence. Only owner/admin may manage entries.';

-- Replace the core financial RPC with the same revenue/refund/COGS rules plus expenses.
CREATE OR REPLACE FUNCTION public.zoal_business_insights_core_stats(
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH eligible_orders AS (
    SELECT o.id, o.total_amount, o.subtotal, o.discount_amount, o.created_at
    FROM public.zoal_orders o
    WHERE o.payment_status = 'paid'
      AND o.status NOT IN ('cancelled', 'refunded')
      AND (p_start IS NULL OR o.created_at >= p_start)
      AND (p_end IS NULL OR o.created_at < p_end)
  ),
  order_totals AS (
    SELECT COUNT(*)::bigint AS order_count,
           COALESCE(SUM(total_amount), 0)::numeric AS gross_revenue,
           COALESCE(SUM(GREATEST(0, subtotal - discount_amount)), 0)::numeric AS net_sales
    FROM eligible_orders
  ),
  refunds AS (
    SELECT COALESCE(SUM(pt.refund_amount), 0)::numeric AS refund_total
    FROM public.zoal_payment_transactions pt
    INNER JOIN eligible_orders eo ON eo.id = pt.order_id
    WHERE pt.refund_amount IS NOT NULL AND pt.refund_amount > 0
  ),
  cogs AS (
    SELECT COUNT(*)::bigint AS eligible_item_count,
           COUNT(*) FILTER (WHERE oi.unit_cost IS NOT NULL)::bigint AS costed_item_count,
           COALESCE(SUM(CASE WHEN oi.unit_cost IS NOT NULL THEN oi.quantity * oi.unit_cost ELSE 0 END), 0)::numeric AS total_cogs,
           COUNT(*) FILTER (WHERE oi.unit_cost IS NULL)::bigint AS uncosted_item_count
    FROM public.zoal_order_items oi
    INNER JOIN eligible_orders eo ON eo.id = oi.order_id
  ),
  expenses AS (
    SELECT COALESCE(SUM(e.amount), 0)::numeric AS operating_expenses
    FROM public.zoal_financial_expenses e
    WHERE e.status = 'posted'
      AND (p_start IS NULL OR e.expense_date >= (p_start AT TIME ZONE 'UTC')::date)
      AND (p_end IS NULL OR e.expense_date < (p_end AT TIME ZONE 'UTC')::date)
  ),
  inventory AS (
    SELECT COUNT(*)::bigint AS low_stock_count
    FROM public.zoal_inventory i
    WHERE i.quantity <= i.low_stock_threshold
  ),
  customers AS (
    SELECT COUNT(*)::bigint AS customer_count
    FROM public.zoal_users u
    WHERE u.role = 'customer'
  ),
  financials AS (
    SELECT ot.order_count,
      GREATEST(0, ot.gross_revenue - r.refund_total)::numeric AS total_revenue,
      GREATEST(0, ot.net_sales - r.refund_total)::numeric AS net_sales_after_refunds,
      c.total_cogs, c.eligible_item_count, c.costed_item_count, c.uncosted_item_count,
      c.uncosted_item_count = 0 AND c.eligible_item_count > 0 AS cogs_complete,
      e.operating_expenses
    FROM order_totals ot CROSS JOIN refunds r CROSS JOIN cogs c CROSS JOIN expenses e
  )
  SELECT jsonb_build_object(
    'totalOrders', f.order_count,
    'totalRevenue', f.total_revenue,
    'activeCustomers', cu.customer_count,
    'averageOrderValue', CASE WHEN f.order_count > 0 THEN f.total_revenue / f.order_count ELSE 0 END,
    'lowStockCount', i.low_stock_count,
    'revenueStatusBasis', 'paid_non_cancelled_non_refunded',
    'refundTotal', (SELECT refund_total FROM refunds),
    'netSalesAfterRefunds', f.net_sales_after_refunds,
    'totalCogs', CASE WHEN f.cogs_complete THEN f.total_cogs ELSE NULL END,
    'grossProfit', CASE WHEN f.cogs_complete THEN f.net_sales_after_refunds - f.total_cogs ELSE NULL END,
    'grossMargin', CASE WHEN f.cogs_complete AND f.net_sales_after_refunds > 0 THEN ((f.net_sales_after_refunds - f.total_cogs) / f.net_sales_after_refunds) * 100 ELSE NULL END,
    'operatingExpenses', CASE WHEN f.cogs_complete THEN f.operating_expenses ELSE NULL END,
    'netProfit', CASE WHEN f.cogs_complete THEN f.net_sales_after_refunds - f.total_cogs - f.operating_expenses ELSE NULL END,
    'netMargin', CASE WHEN f.cogs_complete AND f.net_sales_after_refunds > 0 THEN ((f.net_sales_after_refunds - f.total_cogs - f.operating_expenses) / f.net_sales_after_refunds) * 100 ELSE NULL END,
    'cogsStatus', CASE WHEN f.cogs_complete THEN 'authoritative' WHEN f.eligible_item_count = 0 THEN 'no_eligible_items' ELSE 'incomplete_historical_cost' END,
    'uncostedItemCount', f.uncosted_item_count,
    'profitStatus', CASE WHEN f.cogs_complete THEN 'gross_and_net_profit_available' ELSE 'not_available_without_complete_historical_cogs' END
  )
  FROM financials f CROSS JOIN customers cu CROSS JOIN inventory i;
$function$;

-- The financial RPC is server-only. Prevent direct anonymous/authenticated RPC execution.
REVOKE ALL ON FUNCTION public.zoal_business_insights_core_stats(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zoal_business_insights_core_stats(timestamptz, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.zoal_business_insights_core_stats(timestamptz, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.zoal_business_insights_core_stats(timestamptz, timestamptz) TO service_role;
