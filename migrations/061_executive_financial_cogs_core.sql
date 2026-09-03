-- Executive Decision Center P1 remediation: authoritative order-time COGS and gross-profit aggregation.
-- Additive only: no existing rows are mutated and no existing columns are removed.
-- Historical COGS is considered verified only when every eligible order item has an order-time unit_cost.

CREATE OR REPLACE FUNCTION public.zoal_executive_financial_core_stats(
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
  revenue AS (
    SELECT
      COUNT(*)::bigint AS order_count,
      COALESCE(SUM(total_amount), 0)::numeric AS gross_revenue
    FROM eligible_orders
  ),
  refunds AS (
    SELECT COALESCE(SUM(pt.refund_amount), 0)::numeric AS refund_total
    FROM public.zoal_payment_transactions pt
    INNER JOIN eligible_orders eo ON eo.id = pt.order_id
    WHERE pt.refund_amount IS NOT NULL AND pt.refund_amount > 0
  ),
  item_costs AS (
    SELECT
      COUNT(oi.id)::bigint AS item_count,
      COUNT(oi.id) FILTER (WHERE oi.unit_cost IS NOT NULL)::bigint AS costed_item_count,
      COALESCE(SUM(oi.quantity * oi.unit_cost) FILTER (WHERE oi.unit_cost IS NOT NULL), 0)::numeric AS cogs
    FROM public.zoal_order_items oi
    INNER JOIN eligible_orders eo ON eo.id = oi.order_id
  ),
  net_revenue AS (
    SELECT GREATEST(0, r.gross_revenue - f.refund_total)::numeric AS value
    FROM revenue r CROSS JOIN refunds f
  )
  SELECT jsonb_build_object(
    'orderCount', r.order_count,
    'grossRevenue', r.gross_revenue,
    'refundTotal', f.refund_total,
    'totalRevenue', nr.value,
    'itemCount', ic.item_count,
    'costedItemCount', ic.costed_item_count,
    'cogs', CASE WHEN ic.item_count > 0 AND ic.costed_item_count = ic.item_count THEN ic.cogs ELSE NULL END,
    'grossProfit', CASE WHEN ic.item_count > 0 AND ic.costed_item_count = ic.item_count THEN nr.value - ic.cogs ELSE NULL END,
    'grossMargin', CASE WHEN nr.value > 0 AND ic.item_count > 0 AND ic.costed_item_count = ic.item_count THEN ((nr.value - ic.cogs) / nr.value) * 100 ELSE NULL END,
    'cogsStatus', CASE
      WHEN ic.item_count = 0 THEN 'no_eligible_order_items'
      WHEN ic.costed_item_count = ic.item_count THEN 'verified_order_time_unit_cost_complete'
      ELSE 'unavailable_incomplete_order_time_unit_cost'
    END,
    'profitStatus', CASE
      WHEN ic.item_count > 0 AND ic.costed_item_count = ic.item_count THEN 'verified_from_order_time_unit_cost'
      ELSE 'not_available_without_complete_authoritative_cogs'
    END,
    'revenueStatusBasis', 'paid_non_cancelled_non_refunded_less_recorded_refunds'
  )
  FROM revenue r
  CROSS JOIN refunds f
  CROSS JOIN net_revenue nr
  CROSS JOIN item_costs ic;
$$;

REVOKE ALL ON FUNCTION public.zoal_executive_financial_core_stats(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zoal_executive_financial_core_stats(timestamptz, timestamptz) TO service_role;
