-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - REGIONAL ANALYTICS SCHEMA
-- =========================================================================
-- Version: 015
-- Description: Creates Regional Analytics table: zoal_regional_analytics.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_regional_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0.00,
  customers_count INTEGER DEFAULT 0,
  shipping_cost DECIMAL(15, 2) DEFAULT 0.00,
  growth_rate DECIMAL(5, 2) DEFAULT 0.00,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_regional_analytics ENABLE ROW LEVEL SECURITY;
