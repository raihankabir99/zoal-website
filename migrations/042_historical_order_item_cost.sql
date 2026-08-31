-- =========================================================================
-- 042_historical_order_item_cost.sql
-- Financial Intelligence: preserve authoritative order-time product cost.
-- Existing rows remain NULL because historical cost must never be fabricated.
-- =========================================================================

ALTER TABLE public.zoal_order_items
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,2) NULL
  CHECK (unit_cost IS NULL OR unit_cost >= 0);

CREATE INDEX IF NOT EXISTS idx_zoal_order_items_order_id
  ON public.zoal_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_zoal_order_items_product_id
  ON public.zoal_order_items(product_id);

COMMENT ON COLUMN public.zoal_order_items.unit_cost IS
  'Authoritative product cost captured at order creation time. NULL means historical cost is unavailable; never infer or backfill it from current product cost.';
