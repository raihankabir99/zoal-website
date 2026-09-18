-- ZOAL support live-schema alignment
-- Safe additive/hardening migration: preserves existing ticket data.

CREATE OR REPLACE FUNCTION public.is_support_staff_role()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.zoal_ticket_attachments
  ALTER COLUMN message_id DROP NOT NULL;

ALTER TABLE public.zoal_ticket_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket attachments select policy" ON public.zoal_ticket_attachments;
DROP POLICY IF EXISTS "Ticket attachments insert policy" ON public.zoal_ticket_attachments;
DROP POLICY IF EXISTS "Ticket attachments delete policy" ON public.zoal_ticket_attachments;

CREATE POLICY "Ticket attachments select policy" ON public.zoal_ticket_attachments
  FOR SELECT
  USING (
    public.is_support_staff_role()
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.zoal_support_tickets t
        WHERE t.id = zoal_ticket_attachments.ticket_id
          AND t.customer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Ticket attachments insert policy" ON public.zoal_ticket_attachments
  FOR INSERT
  WITH CHECK (
    public.is_support_staff_role()
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.zoal_support_tickets t
        WHERE t.id = zoal_ticket_attachments.ticket_id
          AND t.customer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Ticket attachments delete policy" ON public.zoal_ticket_attachments
  FOR DELETE
  USING (public.is_support_staff_role());
