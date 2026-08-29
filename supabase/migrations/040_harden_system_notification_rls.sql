-- ZOAL System Notification RLS hardening
-- Replaces overlapping permissive policies with explicit least-privilege policies.
-- No notification rows are deleted or modified.

BEGIN;

ALTER TABLE public.zoal_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer notification isolation" ON public.zoal_notifications;
DROP POLICY IF EXISTS "Notifications delete policy" ON public.zoal_notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON public.zoal_notifications;
DROP POLICY IF EXISTS "Notifications update policy" ON public.zoal_notifications;
DROP POLICY IF EXISTS "zoal_notifications_manage" ON public.zoal_notifications;
DROP POLICY IF EXISTS "zoal_notifications_select" ON public.zoal_notifications;

-- Read: users see their own notifications; staff can see explicitly assigned
-- notifications and role-targeted staff/all notifications; admins/managers see
-- admin/all notifications plus their own; owners have full visibility.
CREATE POLICY "zoal_notifications_select_v2"
ON public.zoal_notifications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()::text
  OR assigned_staff_id = auth.uid()::text
  OR (
    get_auth_user_role() = 'staff'
    AND target_role IN ('staff', 'all')
  )
  OR (
    get_auth_user_role() IN ('admin', 'manager')
    AND target_role IN ('admin', 'all')
  )
  OR get_auth_user_role() = 'owner'
);

-- Insert: ordinary browser users may only create a notification addressed to
-- themselves. Privileged application roles may create notifications within the
-- authenticated system, while service_role remains governed by Supabase's
-- RLS bypass semantics.
CREATE POLICY "zoal_notifications_insert_v2"
ON public.zoal_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text
  OR assigned_staff_id = auth.uid()::text
  OR get_auth_user_role() IN ('admin', 'manager', 'owner')
);

-- Update: users may update their own notification state; assigned staff may
-- update their assigned notifications; privileged roles may update records in
-- their authorized visibility scope.
CREATE POLICY "zoal_notifications_update_v2"
ON public.zoal_notifications
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()::text
  OR assigned_staff_id = auth.uid()::text
  OR get_auth_user_role() IN ('admin', 'manager', 'owner')
)
WITH CHECK (
  user_id = auth.uid()::text
  OR assigned_staff_id = auth.uid()::text
  OR get_auth_user_role() IN ('admin', 'manager', 'owner')
);

-- Delete: users may delete their own notifications; assigned staff may delete
-- assigned notifications; privileged roles retain administrative deletion.
CREATE POLICY "zoal_notifications_delete_v2"
ON public.zoal_notifications
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()::text
  OR assigned_staff_id = auth.uid()::text
  OR get_auth_user_role() IN ('admin', 'manager', 'owner')
);

COMMIT;
