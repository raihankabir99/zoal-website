-- ZOAL Executive Forecast production hardening.
-- Additive migration: preserves the legacy columns for compatibility but makes
-- server-generated forecast metadata explicit and blocks direct public writes.

BEGIN;

ALTER TABLE public.zoal_forecasts
  ADD COLUMN IF NOT EXISTS metric text,
  ADD COLUMN IF NOT EXISTS period_start timestamptz,
  ADD COLUMN IF NOT EXISTS horizon_days integer,
  ADD COLUMN IF NOT EXISTS actual_value numeric,
  ADD COLUMN IF NOT EXISTS forecast_value numeric,
  ADD COLUMN IF NOT EXISTS forecast_method text,
  ADD COLUMN IF NOT EXISTS cutoff_at timestamptz,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS data_status text NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS sample_size integer,
  ADD COLUMN IF NOT EXISTS accuracy_wape numeric;

ALTER TABLE public.zoal_forecasts
  DROP CONSTRAINT IF EXISTS zoal_forecasts_horizon_days_check;
ALTER TABLE public.zoal_forecasts
  ADD CONSTRAINT zoal_forecasts_horizon_days_check
  CHECK (horizon_days IS NULL OR horizon_days IN (7, 30, 90));

ALTER TABLE public.zoal_forecasts
  DROP CONSTRAINT IF EXISTS zoal_forecasts_data_status_check;
ALTER TABLE public.zoal_forecasts
  ADD CONSTRAINT zoal_forecasts_data_status_check
  CHECK (data_status IN ('verified', 'insufficient_history', 'unavailable', 'backtest'));

CREATE INDEX IF NOT EXISTS idx_zoal_forecasts_metric_period
  ON public.zoal_forecasts (metric, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_zoal_forecasts_generated_at
  ON public.zoal_forecasts (generated_at DESC);

ALTER TABLE public.zoal_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forecast_select_authorized" ON public.zoal_forecasts;
DROP POLICY IF EXISTS "forecast_insert_authorized" ON public.zoal_forecasts;
DROP POLICY IF EXISTS "forecast_update_authorized" ON public.zoal_forecasts;
DROP POLICY IF EXISTS "forecast_delete_authorized" ON public.zoal_forecasts;

-- The application server is the sole authority for forecast reads/writes and
-- uses the service-role client. No anon/authenticated direct table access.
REVOKE ALL ON TABLE public.zoal_forecasts FROM anon, authenticated;

COMMIT;
