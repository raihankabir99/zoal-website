-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - KPI ENGINE SCHEMA
-- =========================================================================
-- Version: 016
-- Description: Creates KPI Engine tables: zoal_kpi_snapshots, zoal_kpi_targets.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL, -- e.g., 'Revenue', 'Orders', 'AOV', 'CAC', 'LTV', 'NPS', 'Conversion', 'Refund Rate'
  value DECIMAL(15, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('Weekly', 'Monthly', 'Yearly')),
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_kpi_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT UNIQUE NOT NULL,
  target_value DECIMAL(15, 2) NOT NULL,
  deadline TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE zoal_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_kpi_targets ENABLE ROW LEVEL SECURITY;
