-- ZOAL AI Provider Gateway: durable provider metadata, encrypted credentials, and distributed concurrency leases.
-- Secrets are encrypted application-side with AI_CREDENTIAL_MASTER_KEY; plaintext keys are never stored.

CREATE TABLE IF NOT EXISTS public.zoal_ai_provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  credential_name text NOT NULL,
  secret_ref text NOT NULL,
  encrypted_secret text NOT NULL,
  iv text NOT NULL,
  auth_tag text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz NOT NULL DEFAULT now(),
  last_verified_at timestamptz NULL,
  UNIQUE(provider, credential_name)
);

CREATE INDEX IF NOT EXISTS idx_zoal_ai_provider_credentials_active
  ON public.zoal_ai_provider_credentials(provider, status);

CREATE TABLE IF NOT EXISTS public.zoal_ai_concurrency_leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  request_id uuid NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zoal_ai_concurrency_leases_user
  ON public.zoal_ai_concurrency_leases(user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_zoal_ai_concurrency_leases_request
  ON public.zoal_ai_concurrency_leases(request_id);

ALTER TABLE public.zoal_ai_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_ai_concurrency_leases ENABLE ROW LEVEL SECURITY;

-- These are server-authoritative tables. Client roles must not read or write secrets/leases.
REVOKE ALL ON TABLE public.zoal_ai_provider_credentials FROM anon, authenticated;
REVOKE ALL ON TABLE public.zoal_ai_concurrency_leases FROM anon, authenticated;

-- Explicitly deny direct Data API access through the public schema.
DROP POLICY IF EXISTS zoal_ai_provider_credentials_no_client_access ON public.zoal_ai_provider_credentials;
DROP POLICY IF EXISTS zoal_ai_concurrency_leases_no_client_access ON public.zoal_ai_concurrency_leases;

COMMENT ON TABLE public.zoal_ai_provider_credentials IS 'Server-only encrypted AI provider credentials. Never expose through client/Data API.';
COMMENT ON TABLE public.zoal_ai_concurrency_leases IS 'Server-authoritative distributed AI concurrency leases; expired leases are cleaned on acquisition.';
