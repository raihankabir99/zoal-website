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

-- 1. SELECT POLICIES

-- Customer: Select only notifications explicitly belonging to them
CREATE POLICY "Customer notification isolation" ON zoal_notifications 
FOR SELECT USING (
  user_id = auth.uid()::text OR recipient_id = auth.uid()::text
);

-- Staff: Select notifications assigned directly to them or scoped to staff role
CREATE POLICY "Staff notification isolation" ON zoal_notifications 
FOR SELECT USING (
  is_staff(auth.uid()::text) AND (
    assigned_staff_id = auth.uid()::text 
    OR (recipient_role = 'staff' AND assigned_staff_id = auth.uid()::text)
  )
);

-- Admin: Operational notifications, orders, escalations, inventory, support (excluding owner-only alerts)
CREATE POLICY "Admin notification access" ON zoal_notifications 
FOR SELECT USING (
  is_admin(auth.uid()::text) AND (
    recipient_role IN ('admin', 'staff', 'all') 
    AND category NOT IN ('revenue_owner', 'security_owner')
  )
);

-- Owner: Full enterprise visibility across all notifications
CREATE POLICY "Owner notification full access" ON zoal_notifications 
FOR ALL USING (
  is_owner(auth.uid()::text)
);

-- 2. INSERT POLICY
-- Only system backend/service role or staff+ can insert notifications
CREATE POLICY "Notifications insert policy" ON zoal_notifications 
FOR INSERT WITH CHECK (
  is_staff(auth.uid()::text) OR is_admin(auth.uid()::text) OR is_owner(auth.uid()::text) OR auth.role() = 'service_role'
);

-- 3. UPDATE POLICY
-- Users can update read/archived status of their own notifications; Admins/Owners can update accessible ones
CREATE POLICY "Notifications update policy" ON zoal_notifications 
FOR UPDATE USING (
  user_id = auth.uid()::text 
  OR recipient_id = auth.uid()::text 
  OR assigned_staff_id = auth.uid()::text
  OR is_admin(auth.uid()::text)
  OR is_owner(auth.uid()::text)
);

-- 4. DELETE POLICY
-- Users can delete/archive their own notifications; Admins delete operational; Owner deletes any
CREATE POLICY "Notifications delete policy" ON zoal_notifications 
FOR DELETE USING (
  user_id = auth.uid()::text 
  OR recipient_id = auth.uid()::text 
  OR (is_admin(auth.uid()::text) AND recipient_role IN ('admin', 'staff', 'all'))
  OR is_owner(auth.uid()::text)
);
