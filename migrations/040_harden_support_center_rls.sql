-- =========================================================================
--     040_harden_support_center_rls.sql - STRICT SUPPORT CONCIERGE RLS
-- =========================================================================

-- 1. Helper function for support staff roles
CREATE OR REPLACE FUNCTION public.is_support_staff_role()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Row Level Security (redundancy check)
ALTER TABLE zoal_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_ticket_messages ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL LEGACY SUPPORT POLICIES
DROP POLICY IF EXISTS "Support tickets select policy" ON zoal_support_tickets;
DROP POLICY IF EXISTS "Support tickets insert policy" ON zoal_support_tickets;
DROP POLICY IF EXISTS "Support tickets update policy" ON zoal_support_tickets;
DROP POLICY IF EXISTS "Support tickets delete policy" ON zoal_support_tickets;

DROP POLICY IF EXISTS "Ticket messages select policy" ON zoal_ticket_messages;
DROP POLICY IF EXISTS "Ticket messages insert policy" ON zoal_ticket_messages;
DROP POLICY IF EXISTS "Ticket messages delete policy" ON zoal_ticket_messages;

-- 3. ZOAL_SUPPORT_TICKETS POLICIES

-- SELECT POLICY: Staff can view any ticket; customers can only view their own tickets.
CREATE POLICY "Support tickets select policy" ON zoal_support_tickets
  FOR SELECT
  USING (
    public.is_support_staff_role()
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  );

-- INSERT POLICY: Customers can insert if they set customer_id to their auth uid. Staff can insert any.
CREATE POLICY "Support tickets insert policy" ON zoal_support_tickets
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      customer_id = auth.uid()
      OR public.is_support_staff_role()
    )
  );

-- UPDATE POLICY: Staff can update any. Customers can only update their own (validated additionally in server).
CREATE POLICY "Support tickets update policy" ON zoal_support_tickets
  FOR UPDATE
  USING (
    public.is_support_staff_role()
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  )
  WITH CHECK (
    public.is_support_staff_role()
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  );

-- DELETE POLICY: Only authorized staff can delete support tickets.
CREATE POLICY "Support tickets delete policy" ON zoal_support_tickets
  FOR DELETE
  USING (
    public.is_support_staff_role()
  );


-- 4. ZOAL_TICKET_MESSAGES POLICIES

-- SELECT POLICY: Staff can read all messages; customers can only read messages belonging to their tickets that are NOT internal notes.
CREATE POLICY "Ticket messages select policy" ON zoal_ticket_messages
  FOR SELECT
  USING (
    public.is_support_staff_role()
    OR (
      auth.uid() IS NOT NULL 
      AND NOT is_internal_note 
      AND EXISTS (
        SELECT 1 FROM zoal_support_tickets t 
        WHERE t.id = ticket_id AND t.customer_id = auth.uid()
      )
    )
  );

-- INSERT POLICY: Staff can insert any message. Customers can only insert public messages to their own tickets.
CREATE POLICY "Ticket messages insert policy" ON zoal_ticket_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      public.is_support_staff_role()
      OR (
        user_id = auth.uid()
        AND NOT is_internal_note
        AND EXISTS (
          SELECT 1 FROM zoal_support_tickets t 
          WHERE t.id = ticket_id AND t.customer_id = auth.uid()
        )
      )
    )
  );

-- DELETE POLICY: Only staff can delete messages.
CREATE POLICY "Ticket messages delete policy" ON zoal_ticket_messages
  FOR DELETE
  USING (
    public.is_support_staff_role()
  );
