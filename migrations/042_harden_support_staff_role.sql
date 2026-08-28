-- =========================================================================
--     042_harden_support_staff_role.sql - HARDEN SUPPORT STAFF ROLE HELPER
-- =========================================================================

-- Update the helper function to strictly restrict support staff roles.
-- Removed 'editor' from the list of authorized support staff roles.
CREATE OR REPLACE FUNCTION public.is_support_staff_role()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
