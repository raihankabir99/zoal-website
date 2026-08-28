-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - FORECASTING SCHEMA
-- =========================================================================
-- Version: 018
-- Description: Creates Forecasting table: zoal_forecasts.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('Revenue', 'Inventory', 'Demand', 'Seasonal', 'AI')),
  predicted_value DECIMAL(15, 2) DEFAULT 0.00,
  history_data JSONB DEFAULT '{}',
  scenario TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_forecasts ENABLE ROW LEVEL SECURITY;
