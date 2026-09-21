-- Inventory RLS hardening
-- Inventory operational fields must never be publicly readable through Supabase.
-- Server-side service-role routes remain responsible for authorized inventory access.

ALTER TABLE public.zoal_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zoal_inventory_select" ON public.zoal_inventory;
DROP POLICY IF EXISTS "zoal_inventory_manage" ON public.zoal_inventory;
DROP POLICY IF EXISTS "zoal_inventory_select_privileged" ON public.zoal_inventory;
DROP POLICY IF EXISTS "zoal_inventory_manage_privileged" ON public.zoal_inventory;

CREATE POLICY "zoal_inventory_select_privileged"
  ON public.zoal_inventory
  FOR SELECT
  USING (public.is_privileged_role());

CREATE POLICY "zoal_inventory_manage_privileged"
  ON public.zoal_inventory
  FOR ALL
  USING (public.is_privileged_role())
  WITH CHECK (public.is_privileged_role());

REVOKE ALL ON TABLE public.zoal_inventory FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zoal_inventory TO authenticated;
