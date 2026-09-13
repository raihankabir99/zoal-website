-- =========================================================================
--   AL ZOAL LUXURY BOUTIQUE - ADD OPAQUE SESSION IDENTIFIER TO SESSIONS
-- =========================================================================
-- Version: 053
-- Description: Adds a secure, cryptographically random, and unpredictable
--              opaque_session_id to zoal_sessions for safe public reference
--              without exposing raw authentication tokens.

ALTER TABLE zoal_sessions ADD COLUMN IF NOT EXISTS opaque_session_id TEXT;

-- Safely backfill existing sessions with secure cryptographically random UUIDs
UPDATE zoal_sessions SET opaque_session_id = gen_random_uuid()::text WHERE opaque_session_id IS NULL;

-- Enforce strict constraints: NOT NULL and UNIQUE
ALTER TABLE zoal_sessions ALTER COLUMN opaque_session_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'zoal_sessions_opaque_session_id_key'
  ) THEN
    ALTER TABLE zoal_sessions ADD CONSTRAINT zoal_sessions_opaque_session_id_key UNIQUE (opaque_session_id);
  END IF;
END $$;

-- Create an index to support near-instant lookup during session revocation
CREATE INDEX IF NOT EXISTS idx_zoal_sessions_opaque_id ON zoal_sessions(opaque_session_id);
