-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - MARKETING RLS SECURITY HARDENING
-- =========================================================================
-- Version: 045
-- Description: Drops unsafe public-facing/permissive marketing policies, 
--              and recreates them to require authenticated & authorized roles.
--              Maintains active coupon SELECT for guest checkout and active
--              homepage hero SELECT for public homepage.
-- =========================================================================

-- Ensure Row Level Security (RLS) is enabled on all target tables
ALTER TABLE zoal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_homepage_heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_marketing_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 1. DROP old permissive policies
  DROP POLICY IF EXISTS "Public read campaigns" ON zoal_campaigns;
  DROP POLICY IF EXISTS "Staff manage campaigns" ON zoal_campaigns;

  DROP POLICY IF EXISTS "Public read coupons" ON zoal_coupons;
  DROP POLICY IF EXISTS "Staff manage coupons" ON zoal_coupons;

  DROP POLICY IF EXISTS "Allow public read of active heroes" ON zoal_homepage_heroes;
  DROP POLICY IF EXISTS "Allow administrative manage of heroes" ON zoal_homepage_heroes;

  DROP POLICY IF EXISTS "Public insert subscribers" ON zoal_subscribers;
  DROP POLICY IF EXISTS "Staff manage subscribers" ON zoal_subscribers;

  DROP POLICY IF EXISTS "Staff manage email campaigns" ON zoal_email_campaigns;
  DROP POLICY IF EXISTS "Staff manage sms campaigns" ON zoal_sms_campaigns;
  DROP POLICY IF EXISTS "Staff manage push notifications" ON zoal_push_notifications;
  DROP POLICY IF EXISTS "Staff manage marketing logs" ON zoal_marketing_logs;

  -- 2. CREATE correctly scoped policies
  
  -- Table: zoal_campaigns
  CREATE POLICY "Staff manage campaigns" ON zoal_campaigns
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

  -- Table: zoal_coupons
  -- Guest/public checkout needs to resolve active coupons by code
  CREATE POLICY "Allow public select of active coupons" ON zoal_coupons
    FOR SELECT
    USING (is_active = true);

  CREATE POLICY "Staff manage coupons" ON zoal_coupons
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

  -- Table: zoal_homepage_heroes
  -- Public homepage needs active heroes
  CREATE POLICY "Allow public read of active heroes" ON zoal_homepage_heroes
    FOR SELECT
    USING (active = true);

  CREATE POLICY "Staff manage heroes" ON zoal_homepage_heroes
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

  -- Table: zoal_subscribers
  -- Allow public to register for newsletters
  CREATE POLICY "Public insert subscribers" ON zoal_subscribers
    FOR INSERT
    WITH CHECK (true);

  CREATE POLICY "Staff manage subscribers" ON zoal_subscribers
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

  -- Table: zoal_email_campaigns
  CREATE POLICY "Staff manage email campaigns" ON zoal_email_campaigns
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

  -- Table: zoal_sms_campaigns
  CREATE POLICY "Staff manage sms campaigns" ON zoal_sms_campaigns
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

  -- Table: zoal_push_notifications
  CREATE POLICY "Staff manage push notifications" ON zoal_push_notifications
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

  -- Table: zoal_marketing_logs
  CREATE POLICY "Staff manage marketing logs" ON zoal_marketing_logs
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );

END $$;
