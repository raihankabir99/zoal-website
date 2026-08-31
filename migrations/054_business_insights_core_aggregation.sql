-- Business Insights P1 remediation: authoritative, bounded database aggregation.
-- Additive only: no table/column changes and no data mutation.

CREATE OR REPLACE FUNCTION public.zoal_business_insights_core_stats(
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible_orders AS (
    SELECT o.id, o.total_amount, o.created_at
    FROM public.zoal_orders o
    WHERE o.payment_status = 'paid'
      AND o.status NOT IN ('cancelled', 'refunded')
      AND (p_start IS NULL OR o.created_at >= p_start)
      AND (p_end IS NULL OR o.created_at < p_end)
  ),
  order_totals AS (
    SELECT COUNT(*)::bigint AS order_count, COALESCE(SUM(total_amount), 0)::numeric AS gross_revenue
    FROM eligible_orders
  ),
  refunds AS (
    SELECT COALESCE(SUM(pt.refund_amount), 0)::numeric AS refund_total
    FROM public.zoal_payment_transactions pt
    INNER JOIN eligible_orders eo ON eo.id = pt.order_id
    WHERE pt.refund_amount IS NOT NULL AND pt.refund_amount > 0
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
  )
  SELECT jsonb_build_object(
    'totalOrders', ot.order_count,
    'totalRevenue', GREATEST(0, ot.gross_revenue - r.refund_total),
    'activeCustomers', c.customer_count,
    'averageOrderValue', CASE WHEN ot.order_count > 0 THEN GREATEST(0, ot.gross_revenue - r.refund_total) / ot.order_count ELSE 0 END,
    'lowStockCount', i.low_stock_count,
    'revenueStatusBasis', 'paid_non_cancelled_non_refunded',
    'profitStatus', 'not_available_without_authoritative_cogs'
  )
  FROM order_totals ot CROSS JOIN refunds r CROSS JOIN customers c CROSS JOIN inventory i;
$$;

CREATE OR REPLACE FUNCTION public.zoal_business_insights_regional(
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL
)
RETURNS TABLE(region text, revenue numeric, order_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(a.city, 'Unknown')::text AS region,
         COALESCE(SUM(o.total_amount), 0)::numeric AS revenue,
         COUNT(*)::bigint AS order_count
  FROM public.zoal_orders o
  LEFT JOIN public.zoal_addresses a ON a.id = o.shipping_address_id
  WHERE o.payment_status = 'paid'
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_start IS NULL OR o.created_at >= p_start)
    AND (p_end IS NULL OR o.created_at < p_end)
  GROUP BY COALESCE(a.city, 'Unknown')
  ORDER BY revenue DESC;
$$;

REVOKE ALL ON FUNCTION public.zoal_business_insights_core_stats(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zoal_business_insights_regional(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zoal_business_insights_core_stats(timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.zoal_business_insights_regional(timestamptz, timestamptz) TO service_role;

CREATE INDEX IF NOT EXISTS idx_zoal_orders_business_insights_created_status_payment
  ON public.zoal_orders (created_at, status, payment_status);

CREATE INDEX IF NOT EXISTS idx_zoal_payment_transactions_business_insights_order_refund
  ON public.zoal_payment_transactions (order_id, refund_amount);
