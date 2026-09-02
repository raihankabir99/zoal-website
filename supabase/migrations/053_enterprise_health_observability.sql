-- ZOAL Enterprise Health Observability
-- Additive only: historical snapshots + incident state for autonomous monitoring.
-- No existing application data is modified or deleted.

BEGIN;

CREATE TABLE IF NOT EXISTS public.zoal_health_monitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN')),
  database_status TEXT NOT NULL CHECK (database_status IN ('HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN')),
  database_latency_ms INTEGER,
  backend_status TEXT NOT NULL CHECK (backend_status IN ('HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN')),
  backend_processing_ms INTEGER,
  runtime_status TEXT NOT NULL CHECK (runtime_status IN ('HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN')),
  rss_mb NUMERIC(12,2),
  heap_used_mb NUMERIC(12,2),
  heap_total_mb NUMERIC(12,2),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_zoal_health_snapshots_checked_at
  ON public.zoal_health_monitor_snapshots (checked_at DESC);

CREATE TABLE IF NOT EXISTS public.zoal_health_monitor_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL CHECK (severity IN ('DEGRADED','UNHEALTHY')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  last_alerted_at TIMESTAMPTZ,
  occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count > 0),
  last_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_zoal_health_incidents_status
  ON public.zoal_health_monitor_incidents (status, last_seen DESC);

ALTER TABLE public.zoal_health_monitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_health_monitor_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health snapshots admin read" ON public.zoal_health_monitor_snapshots;
DROP POLICY IF EXISTS "health incidents admin read" ON public.zoal_health_monitor_incidents;

CREATE POLICY "health snapshots admin read"
ON public.zoal_health_monitor_snapshots
FOR SELECT TO authenticated
USING (get_auth_user_role() IN ('owner','admin'));

CREATE POLICY "health incidents admin read"
ON public.zoal_health_monitor_incidents
FOR SELECT TO authenticated
USING (get_auth_user_role() IN ('owner','admin'));

-- Atomic observation recording. Only the server's service_role may call this RPC.
-- It returns whether a new/escalated alert should be emitted, preventing repeated
-- alerts from a polling loop and reducing duplicate notifications in multi-instance deployments.
CREATE OR REPLACE FUNCTION public.record_health_observation(
  p_checked_at TIMESTAMPTZ,
  p_overall_status TEXT,
  p_database_status TEXT,
  p_database_latency_ms INTEGER,
  p_backend_status TEXT,
  p_backend_processing_ms INTEGER,
  p_runtime_status TEXT,
  p_rss_mb NUMERIC,
  p_heap_used_mb NUMERIC,
  p_heap_total_mb NUMERIC,
  p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_incident public.zoal_health_monitor_incidents;
  v_should_alert BOOLEAN := FALSE;
BEGIN
  INSERT INTO public.zoal_health_monitor_snapshots (
    checked_at, overall_status, database_status, database_latency_ms,
    backend_status, backend_processing_ms, runtime_status,
    rss_mb, heap_used_mb, heap_total_mb, error_message
  ) VALUES (
    p_checked_at, p_overall_status, p_database_status, p_database_latency_ms,
    p_backend_status, p_backend_processing_ms, p_runtime_status,
    p_rss_mb, p_heap_used_mb, p_heap_total_mb, p_error_message
  );

  IF p_overall_status IN ('DEGRADED','UNHEALTHY') THEN
    INSERT INTO public.zoal_health_monitor_incidents (
      fingerprint, severity, status, first_seen, last_seen,
      last_alerted_at, occurrence_count, last_message
    ) VALUES (
      'system-health', p_overall_status, 'open', p_checked_at, p_checked_at,
      p_checked_at, 1, COALESCE(p_error_message, 'System health degraded')
    )
    ON CONFLICT (fingerprint) DO UPDATE SET
      severity = EXCLUDED.severity,
      status = 'open',
      last_seen = EXCLUDED.last_seen,
      occurrence_count = public.zoal_health_monitor_incidents.occurrence_count + 1,
      last_message = EXCLUDED.last_message,
      resolved_at = NULL
    RETURNING * INTO v_incident;

    -- Alert on a new incident or severity escalation. Repeated polling does not spam alerts.
    IF v_incident.last_alerted_at IS NULL
       OR v_incident.last_alerted_at < v_incident.first_seen
       OR (v_incident.severity = 'UNHEALTHY' AND v_incident.last_alerted_at < p_checked_at - INTERVAL '15 minutes') THEN
      v_should_alert := TRUE;
      UPDATE public.zoal_health_monitor_incidents
      SET last_alerted_at = p_checked_at
      WHERE id = v_incident.id;
    END IF;
  ELSE
    UPDATE public.zoal_health_monitor_incidents
    SET status = 'resolved', resolved_at = COALESCE(resolved_at, p_checked_at), last_seen = p_checked_at
    WHERE fingerprint = 'system-health' AND status = 'open';
  END IF;

  RETURN jsonb_build_object(
    'should_alert', v_should_alert,
    'status', p_overall_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_health_observation(
  TIMESTAMPTZ, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_health_observation(
  TIMESTAMPTZ, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT
) TO service_role;

COMMIT;
