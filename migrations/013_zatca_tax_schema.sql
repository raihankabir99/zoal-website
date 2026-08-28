-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - ZATCA TAX MANAGEMENT SCHEMA
-- =========================================================================
-- Version: 013
-- Description: Creates ZATCA compliant tax management tables: 
--              zoal_tax_settings, zoal_tax_rates, zoal_tax_regions, zoal_tax_logs.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_tax_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- e.g., 'Standard VAT', 'Zero Rated', 'Exempt'
  rate_percentage DECIMAL(5, 2) NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('VAT', 'Zero Rated', 'Exempt')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_tax_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_name TEXT UNIQUE NOT NULL,
  rate_override_id UUID REFERENCES zoal_tax_rates(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_tax_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_tax_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_tax_logs ENABLE ROW LEVEL SECURITY;
