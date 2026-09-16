-- ZOAL Executive Forecast RLS compatibility hardening
-- Uses the project's verified role resolver instead of undefined helper signatures.
-- Safe to re-run.

ALTER TABLE public.zoal_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Executive forecast read access" ON public.zoal_forecasts;

REVOKE ALL ON TABLE public.zoal_forecasts FROM anon, authenticated;

CREATE POLICY "Executive forecast read access"
  ON public.zoal_forecasts
  FOR SELECT
  TO authenticated
  USING (public.get_auth_user_role() IN ('owner', 'admin', 'manager'));

CREATE INDEX IF NOT EXISTS idx_zoal_forecasts_period_horizon
  ON public.zoal_forecasts (period_start, horizon_days);

CREATE INDEX IF NOT EXISTS idx_zoal_forecasts_metric_generated
  ON public.zoal_forecasts (metric, generated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'zoal_forecasts_horizon_days_chk'
      AND conrelid = 'public.zoal_forecasts'::regclass
  ) THEN
    ALTER TABLE public.zoal_forecasts
      ADD CONSTRAINT zoal_forecasts_horizon_days_chk
      CHECK (horizon_days IS NULL OR horizon_days IN (7,30,90));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'zoal_forecasts_sample_size_chk'
      AND conrelid = 'public.zoal_forecasts'::regclass
  ) THEN
    ALTER TABLE public.zoal_forecasts
      ADD CONSTRAINT zoal_forecasts_sample_size_chk
      CHECK (sample_size IS NULL OR sample_size >= 0);
  END IF;
END $$;
