-- =========================================================================
--             031_notification_rls.sql - PRODUCTION NOTIFICATIONS RLS
-- =========================================================================

-- Enable Row Level Security on zoal_notifications
ALTER TABLE zoal_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Customer notification isolation" ON zoal_notifications;
DROP POLICY IF EXISTS "Staff notification isolation" ON zoal_notifications;
DROP POLICY IF EXISTS "Admin notification access" ON zoal_notifications;
DROP POLICY IF EXISTS "Owner notification full access" ON zoal_notifications;
DROP POLICY IF EXISTS "Notifications update policy" ON zoal_notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON zoal_notifications;
DROP POLICY IF EXISTS "Notifications delete policy" ON zoal_notifications;

-- 1. SELECT POLICY
-- Customers can read their own notifications; Staff/Admin/Owner can read any
CREATE POLICY "Customer notification isolation" ON zoal_notifications 
FOR SELECT USING (
  user_id = auth.uid()::text OR public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff')
);

-- 2. INSERT POLICY
-- Authenticated users or backend service role can insert notifications
CREATE POLICY "Notifications insert policy" ON zoal_notifications 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL OR auth.role() = 'service_role'
);

-- 3. UPDATE POLICY
-- Users can update read status of their own notifications; Staff/Admin/Owner can update any
CREATE POLICY "Notifications update policy" ON zoal_notifications 
FOR UPDATE USING (
  user_id = auth.uid()::text OR public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff')
);

-- 4. DELETE POLICY
-- Users can delete their own notifications; Staff/Admin/Owner can delete any
CREATE POLICY "Notifications delete policy" ON zoal_notifications 
FOR DELETE USING (
  user_id = auth.uid()::text OR public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff')
);
