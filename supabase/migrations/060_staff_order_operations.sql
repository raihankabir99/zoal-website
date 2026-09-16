-- Staff order-operation fields required by the existing Staff Dashboard UI.
-- Additive only: no existing data is removed or rewritten.
ALTER TABLE public.zoal_orders
  ADD COLUMN IF NOT EXISTS assigned_staff_id text,
  ADD COLUMN IF NOT EXISTS assigned_staff_name text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS staff_notes text,
  ADD COLUMN IF NOT EXISTS customer_notes text;

CREATE INDEX IF NOT EXISTS idx_zoal_orders_assigned_staff_id
  ON public.zoal_orders (assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;