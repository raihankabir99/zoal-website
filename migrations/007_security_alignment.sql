-- =========================================================================
-- AL ZOAL - SECURITY ALIGNMENT
-- Version: 007
-- Purpose: Keep application RBAC and Supabase Storage authorization aligned.
-- Safe/idempotent: no tables are dropped or recreated.
-- =========================================================================

-- 1. Align database role values with the application RBAC vocabulary.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'zoal_users'
      AND a.attname = 'role'
      AND c.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.zoal_users DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.zoal_users
  ADD CONSTRAINT zoal_users_role_check
  CHECK (role IN ('customer', 'author', 'staff', 'editor', 'manager', 'admin', 'owner'));

-- 2. Storage authorization must honor the same privileged hierarchy.
CREATE OR REPLACE FUNCTION storage.is_zoal_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.zoal_users
    WHERE id = auth.uid()::text
      AND role IN ('staff', 'manager', 'admin', 'owner')
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admin/Staff full access to storage" ON storage.objects;

CREATE POLICY "Admin/Staff full access to storage" ON storage.objects
  FOR ALL
  USING (storage.is_zoal_admin())
  WITH CHECK (storage.is_zoal_admin());
