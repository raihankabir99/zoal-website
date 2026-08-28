-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - MARKETING SCHEMAS ENHANCEMENT
-- =========================================================================
-- Version: 043
-- Description: Enhances zoal_campaigns with category and discount_percent,
--              ensures zoal_coupons and zoal_campaigns constraints & RLS policies.
-- =========================================================================

-- Add missing columns to zoal_campaigns
ALTER TABLE zoal_campaigns ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 10;
ALTER TABLE zoal_campaigns ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'coffee';
ALTER TABLE zoal_campaigns ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'VIP Customers';
ALTER TABLE zoal_campaigns ADD COLUMN IF NOT EXISTS conversion_rate TEXT DEFAULT '0.0%';

-- Ensure RLS policies exist and allow appropriate access
DO $$
BEGIN
  -- RLS for zoal_campaigns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_campaigns' AND policyname = 'Public read campaigns'
  ) THEN
    CREATE POLICY "Public read campaigns" ON zoal_campaigns FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_campaigns' AND policyname = 'Staff manage campaigns'
  ) THEN
    CREATE POLICY "Staff manage campaigns" ON zoal_campaigns FOR ALL USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );
  END IF;

  -- RLS for zoal_coupons
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_coupons' AND policyname = 'Public read coupons'
  ) THEN
    CREATE POLICY "Public read coupons" ON zoal_coupons FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_coupons' AND policyname = 'Staff manage coupons'
  ) THEN
    CREATE POLICY "Staff manage coupons" ON zoal_coupons FOR ALL USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );
  END IF;
END $$;
