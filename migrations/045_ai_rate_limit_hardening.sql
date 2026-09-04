-- Durable distributed AI rate-limit state.
-- Keep this server-only; application accesses it with DATABASE_URL.
CREATE TABLE IF NOT EXISTS public.zoal_ai_rate_limits (
  user_id text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_zoal_ai_rate_limits_window_start
  ON public.zoal_ai_rate_limits (window_start);

ALTER TABLE public.zoal_ai_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.zoal_ai_rate_limits FROM anon, authenticated;

COMMENT ON TABLE public.zoal_ai_rate_limits IS
  'Server-only durable fixed-window AI rate-limit counters for distributed enforcement.';

COMMENT ON COLUMN public.zoal_ai_rate_limits.user_id IS
  'Canonical authenticated-user identifier used by the server-side AI gateway.';

COMMENT ON COLUMN public.zoal_ai_rate_limits.window_start IS
  'UTC fixed-window boundary.';
