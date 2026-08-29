-- ZOAL System Notification compatibility/state integrity hardening.
-- Additive and non-destructive. Keeps the legacy `is_read`/`created_at` columns
-- synchronized with the canonical application-facing `read`/`timestamp` fields.

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_zoal_notification_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.read := COALESCE(NEW.read, NEW.is_read, false);
    NEW.is_read := NEW.read;
    NEW.timestamp := COALESCE(NEW.timestamp, NEW.created_at, now());
    NEW.created_at := COALESCE(NEW.created_at, NEW.timestamp, now());
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.read IS DISTINCT FROM OLD.read THEN
      NEW.is_read := NEW.read;
    ELSIF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
      NEW.read := NEW.is_read;
    ELSE
      NEW.read := COALESCE(NEW.read, NEW.is_read, false);
      NEW.is_read := NEW.read;
    END IF;

    IF NEW.timestamp IS DISTINCT FROM OLD.timestamp THEN
      NEW.created_at := NEW.timestamp;
    ELSIF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      NEW.timestamp := NEW.created_at;
    ELSE
      NEW.timestamp := COALESCE(NEW.timestamp, NEW.created_at, now());
      NEW.created_at := NEW.timestamp;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_zoal_notification_state ON public.zoal_notifications;

CREATE TRIGGER trg_sync_zoal_notification_state
BEFORE INSERT OR UPDATE ON public.zoal_notifications
FOR EACH ROW
EXECUTE FUNCTION public.sync_zoal_notification_state();

COMMIT;
