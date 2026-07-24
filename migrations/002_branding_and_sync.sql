-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - BRANDING & SYNC
-- =========================================================================
-- Version: 002
-- Description: Branding settings table and Dynamic Product Sync table.

CREATE TABLE IF NOT EXISTS branding_settings (
  id INT PRIMARY KEY CHECK (id = 1),
  business_name TEXT,
  business_logo TEXT,
  favicon TEXT,
  company_description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  social_links JSONB,
  accent_color TEXT,
  theme TEXT,
  language TEXT,
  currency TEXT,
  shipping_fee_default NUMERIC,
  shipping_free_threshold NUMERIC,
  tax_rate NUMERIC,
  tax_id TEXT,
  smtp_host TEXT,
  smtp_port TEXT,
  smtp_user TEXT,
  smtp_pass TEXT,
  ip_whitelist TEXT,
  session_expiration_minutes INT,
  auto_backup_frequency TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);

-- Enable RLS
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone
DROP POLICY IF EXISTS "Allow public read access to branding settings" ON branding_settings;
CREATE POLICY "Allow public read access to branding settings" ON branding_settings
  FOR SELECT USING (true);

-- Product Sync table (UUID based)
CREATE TABLE IF NOT EXISTS zoal_supabase_products (
  id UUID PRIMARY KEY,
  friendly_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE zoal_supabase_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of sync products" ON zoal_supabase_products;
CREATE POLICY "Allow public read of sync products" ON zoal_supabase_products FOR SELECT USING (true);
