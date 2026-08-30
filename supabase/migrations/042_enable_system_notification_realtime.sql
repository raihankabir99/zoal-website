-- ZOAL System Notification Realtime publication hardening.
-- Additive and non-destructive. Registers the canonical notification table
-- with Supabase Realtime only when it is not already present.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'zoal_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.zoal_notifications;
  END IF;
END;
$$;

COMMIT;
