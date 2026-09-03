-- =========================================================================
--   AL ZOAL ENTERPRISE SUITE - BRANDING & SETTINGS SECURITY HARDENING
-- =========================================================================
-- Version: 059
-- Description: Revokes public direct table access to branding_settings to protect
--              SMTP secrets and credentials. Enforces role-based RLS.

-- 1. Ensure RLS is enabled on branding_settings
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Allow public read access to branding settings" ON branding_settings;
DROP POLICY IF EXISTS "Allow staff and admins to read branding settings" ON branding_settings;
DROP POLICY IF EXISTS "Allow admins to manage branding settings" ON branding_settings;

-- 3. Restrict SELECT to authenticated staff, managers, admins, and owners
CREATE POLICY "Allow staff and admins to read branding settings" ON branding_settings
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('admin', 'manager', 'owner', 'staff') OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager', 'owner', 'staff') OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager', 'owner', 'staff')
  );

-- 4. Restrict INSERT/UPDATE/DELETE to authenticated managers, admins, and owners
CREATE POLICY "Allow admins to manage branding settings" ON branding_settings
  FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('admin', 'manager', 'owner') OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager', 'owner') OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager', 'owner')
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('admin', 'manager', 'owner') OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager', 'owner') OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager', 'owner')
  );
