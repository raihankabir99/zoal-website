ALTER TABLE zoal_ai_briefings
  ADD COLUMN IF NOT EXISTS executive_summary TEXT;

COMMENT ON COLUMN zoal_ai_briefings.executive_summary IS
  'Server-validated AI executive summary. Numerical and unavailable financial claims are gated before persistence.';
