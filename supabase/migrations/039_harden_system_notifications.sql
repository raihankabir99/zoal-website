-- ZOAL System Notification hardening
-- Safe, additive migration. Does NOT drop data or rewrite existing rows.
-- Apply only after reviewing the live schema and application contract.

BEGIN;

-- Reconcile the live table with the enterprise notification contract.
ALTER TABLE public.zoal_notifications
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS assigned_staff_id text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS roles text[];

-- Keep legacy DB naming usable while the application is migrated.
ALTER TABLE public.zoal_notifications
  ADD COLUMN IF NOT EXISTS read boolean;

UPDATE public.zoal_notifications
SET read = is_read
WHERE read IS NULL;

ALTER TABLE public.zoal_notifications
  ALTER COLUMN read SET DEFAULT false;

-- Timestamp compatibility for application code that currently expects timestamp.
ALTER TABLE public.zoal_notifications
  ADD COLUMN IF NOT EXISTS timestamp timestamptz;

UPDATE public.zoal_notifications
SET timestamp = created_at
WHERE timestamp IS NULL;

ALTER TABLE public.zoal_notifications
  ALTER COLUMN timestamp SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_zoal_notifications_user_created
  ON public.zoal_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_zoal_notifications_staff_created
  ON public.zoal_notifications (assigned_staff_id, created_at DESC)
  WHERE assigned_staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_zoal_notifications_archived
  ON public.zoal_notifications (user_id, archived, created_at DESC);

COMMIT;
