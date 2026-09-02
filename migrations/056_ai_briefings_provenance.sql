-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - AI BRIEFINGS PROVENANCE MIGRATION
-- =========================================================================
-- Version: 056
-- Description: Adds audit provenance, verification status, and data context columns to zoal_ai_briefings.
-- =========================================================================

ALTER TABLE zoal_ai_briefings 
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS generation_context JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_period JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_as_of TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-3.8-flash',
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'manual' CHECK (verification_status IN ('manual', 'draft', 'generated', 'verified', 'validation_failed', 'generation_failed'));

-- Create index on verification status and captured_at
CREATE INDEX IF NOT EXISTS idx_zoal_ai_briefings_verification ON zoal_ai_briefings(verification_status, captured_at DESC);
