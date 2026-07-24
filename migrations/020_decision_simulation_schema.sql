-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - DECISION SIMULATION SCHEMA
-- =========================================================================
-- Version: 020
-- Description: Creates Decision Simulation tables: zoal_decision_models, zoal_simulation_runs.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_decision_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Pricing', 'Warehouse', 'Discount', 'Inventory')),
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_simulation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES zoal_decision_models(id),
  revenue_projection DECIMAL(15, 2) DEFAULT 0.00,
  profit_projection DECIMAL(15, 2) DEFAULT 0.00,
  risk_score INTEGER DEFAULT 0,
  scenario_data JSONB DEFAULT '{}',
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_decision_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_simulation_runs ENABLE ROW LEVEL SECURITY;
