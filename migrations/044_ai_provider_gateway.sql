CREATE TABLE IF NOT EXISTS public.zoal_ai_provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  credential_name text NOT NULL,
  secret_ref text NOT NULL,
  encrypted_secret text NOT NULL,
  iv text NOT NULL,
  auth_tag text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'retired')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  last_verified_at timestamptz,
  UNIQUE (provider, credential_name)
);

CREATE TABLE IF NOT EXISTS public.zoal_ai_concurrency_leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  request_id uuid NOT NULL UNIQUE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zoal_ai_concurrency_leases_user_expiry
  ON public.zoal_ai_concurrency_leases (user_id, expires_at);

ALTER TABLE public.zoal_ai_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_ai_concurrency_leases ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.zoal_ai_provider_credentials FROM anon, authenticated;
REVOKE ALL ON public.zoal_ai_concurrency_leases FROM anon, authenticated;

COMMENT ON TABLE public.zoal_ai_provider_credentials IS 'Server-only encrypted AI provider credentials. Never expose through the client Data API.';
COMMENT ON TABLE public.zoal_ai_concurrency_leases IS 'Durable distributed leases used to enforce per-user AI concurrency across server instances.';
