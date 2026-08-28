-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - AI BRIEFING SCHEMA
-- =========================================================================
-- Version: 019
-- Description: Creates AI Briefing table: zoal_ai_briefings.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_ai_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  briefing_type TEXT NOT NULL CHECK (briefing_type IN ('Daily', 'Weekly', 'Monthly')),
  risks TEXT,
  recommendations TEXT,
  revenue_summary JSONB DEFAULT '{}',
  inventory_summary JSONB DEFAULT '{}',
  customer_summary JSONB DEFAULT '{}',
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_ai_briefings ENABLE ROW LEVEL SECURITY;
