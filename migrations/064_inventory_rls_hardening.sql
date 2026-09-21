-- Inventory RLS hardening
-- Inventory operational fields must never be publicly readable through Supabase.
-- Server-side service-role routes remain responsible for authorized inventory access.

ALTER TABLE public.zoal_inventory ENABLE ROW LEVEL SECURITY;

-- Remove every existing inventory policy, not only policies with names from one migration.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'zoal_inventory'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.zoal_inventory', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "zoal_inventory_select_privileged"
  ON public.zoal_inventory
  FOR SELECT
  TO authenticated
  USING (public.is_privileged_role());

CREATE POLICY "zoal_inventory_manage_privileged"
  ON public.zoal_inventory
  FOR ALL
  TO authenticated
  USING (public.is_privileged_role())
  WITH CHECK (public.is_privileged_role());

REVOKE ALL ON TABLE public.zoal_inventory FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zoal_inventory TO authenticated;
