-- ZOAL Executive Forecast production hardening
-- Adds snapshot metadata required by server/forecasting.ts and closes direct client access.

ALTER TABLE public.zoal_forecasts
  ADD COLUMN IF NOT EXISTS metric TEXT,
  ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS horizon_days INTEGER,
  ADD COLUMN IF NOT EXISTS actual_value NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS forecast_value NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS forecast_method TEXT,
  ADD COLUMN IF NOT EXISTS cutoff_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS model_version TEXT,
  ADD COLUMN IF NOT EXISTS data_status TEXT,
  ADD COLUMN IF NOT EXISTS sample_size INTEGER,
  ADD COLUMN IF NOT EXISTS accuracy_wape NUMERIC(10,2);

ALTER TABLE public.zoal_forecasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Executive forecast read access" ON public.zoal_forecasts;

CREATE POLICY "Executive forecast read access"
  ON public.zoal_forecasts
  FOR SELECT
  TO authenticated
  USING (is_owner(auth.uid()::text) OR is_admin(auth.uid()::text) OR is_manager(auth.uid()::text));

REVOKE ALL ON TABLE public.zoal_forecasts FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_zoal_forecasts_period_horizon
  ON public.zoal_forecasts (period_start, horizon_days);
CREATE INDEX IF NOT EXISTS idx_zoal_forecasts_metric_generated
  ON public.zoal_forecasts (metric, generated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zoal_forecasts_horizon_days_chk' AND conrelid = 'public.zoal_forecasts'::regclass) THEN
    ALTER TABLE public.zoal_forecasts ADD CONSTRAINT zoal_forecasts_horizon_days_chk CHECK (horizon_days IS NULL OR horizon_days IN (7,30,90));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zoal_forecasts_sample_size_chk' AND conrelid = 'public.zoal_forecasts'::regclass) THEN
    ALTER TABLE public.zoal_forecasts ADD CONSTRAINT zoal_forecasts_sample_size_chk CHECK (sample_size IS NULL OR sample_size >= 0);
  END IF;
END $$;
