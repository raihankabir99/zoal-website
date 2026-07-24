-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - GROWTH ANALYTICS SCHEMA
-- =========================================================================
-- Version: 017
-- Description: Creates Growth Analytics table: zoal_growth_reports.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_growth_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traffic_count INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  ads_spend DECIMAL(15, 2) DEFAULT 0.00,
  organic_count INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
  funnels_data JSONB DEFAULT '{}',
  campaign_roi DECIMAL(15, 2) DEFAULT 0.00,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_growth_reports ENABLE ROW LEVEL SECURITY;
