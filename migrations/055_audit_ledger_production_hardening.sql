-- 055_audit_ledger_production_hardening.sql
-- Authoritative, immutable enterprise audit ledger hardening.

ALTER TABLE zoal_activity_logs 
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS resource_id TEXT,
  ADD COLUMN IF NOT EXISTS before_state JSONB,
  ADD COLUMN IF NOT EXISTS after_state JSONB,
  ADD COLUMN IF NOT EXISTS changed_fields TEXT[],
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS result TEXT DEFAULT 'SUCCESS',
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'INFO',
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'server';

-- Indexes for high-performance audit querying and filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON zoal_activity_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON zoal_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON zoal_activity_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON zoal_activity_logs (severity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_source ON zoal_activity_logs (source);

-- Harden RLS on zoal_activity_logs
ALTER TABLE zoal_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop any legacy or insecure policies
DROP POLICY IF EXISTS "zoal_activity_logs_insert" ON zoal_activity_logs;
DROP POLICY IF EXISTS "zoal_activity_logs_update" ON zoal_activity_logs;
DROP POLICY IF EXISTS "zoal_activity_logs_delete" ON zoal_activity_logs;

-- Read policy: only privileged roles can view audit logs
DROP POLICY IF EXISTS "zoal_activity_logs_select" ON zoal_activity_logs;
CREATE POLICY "zoal_activity_logs_select" ON zoal_activity_logs 
  FOR SELECT 
  USING (public.is_privileged_role());
