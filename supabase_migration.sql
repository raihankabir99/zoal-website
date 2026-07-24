-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - RLS & RBAC MIGRATION
-- =========================================================================

-- 1. RBAC HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(uid TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM zoal_users WHERE id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_staff_permission(uid TEXT, perm TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM zoal_staff_details 
    WHERE user_id = uid AND (perm = ANY(permissions) OR 'owner' = ANY(permissions))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff(uid TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM zoal_users WHERE id = uid) IN ('staff', 'admin') OR has_staff_permission(uid, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_manager(uid TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM zoal_users WHERE id = uid) = 'admin' OR has_staff_permission(uid, 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(uid TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM zoal_users WHERE id = uid) = 'admin' OR has_staff_permission(uid, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_owner(uid TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_staff_permission(uid, 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. POLICIES (Example for core tables)

-- zoal_users: Customer access
DROP POLICY IF EXISTS "Customers can access own profile" ON zoal_users;
CREATE POLICY "Customers can access own profile" ON zoal_users FOR ALL USING (id = auth.uid());
CREATE POLICY "Admins/Owners can access all users" ON zoal_users FOR SELECT USING (is_admin(auth.uid()::text) OR is_owner(auth.uid()::text));

-- zoal_orders: Customer access
DROP POLICY IF EXISTS "Customers can access own orders" ON zoal_orders;
CREATE POLICY "Customers can access own orders" ON zoal_orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Staff can access all orders" ON zoal_orders FOR SELECT USING (is_staff(auth.uid()::text));
CREATE POLICY "Admin/Owner can manage all orders" ON zoal_orders FOR ALL USING (is_admin(auth.uid()::text) OR is_owner(auth.uid()::text));

-- zoal_inventory: Restricted to Staff+
DROP POLICY IF EXISTS "Staff can access inventory" ON zoal_inventory;
CREATE POLICY "Staff can access inventory" ON zoal_inventory FOR SELECT USING (is_staff(auth.uid()::text));
CREATE POLICY "Admin/Owner can manage inventory" ON zoal_inventory FOR ALL USING (is_admin(auth.uid()::text) OR is_owner(auth.uid()::text));

-- Apply similar patterns to other tables...
-- (Note: Due to constraints, this migration focuses on core tables. 
--  Additional policies should follow this pattern.)
