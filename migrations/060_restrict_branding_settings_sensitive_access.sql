-- =========================================================================
-- ZOAL ENTERPRISE PLATFORM — BRANDING SETTINGS SENSITIVE ACCESS REMEDIATION
-- =========================================================================
-- Version: 060
-- Purpose: Remove direct SELECT access for staff because branding_settings
--          contains sensitive server configuration (including smtp_pass).
--          Browser users must consume the safe server-side API projection.

ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow staff and admins to read branding settings" ON branding_settings;

CREATE POLICY "Allow privileged users to read branding settings"
ON branding_settings
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role') IN ('admin', 'manager', 'owner')
  OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager', 'owner')
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager', 'owner')
);

-- Explicitly document the security boundary:
-- staff has no direct SELECT access to branding_settings.
-- All browser-facing settings are served through the safe API projection.
