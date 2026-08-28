-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - MARKETING AND CMS HARDENING POLICY
-- =========================================================================
-- Version: 044
-- Description: Establishes RLS policies for zoal_subscribers, zoal_banners,
--              zoal_cms_pages, zoal_cms_sections, and zoal_homepage_blocks.
-- =========================================================================

-- Ensure RLS is enabled
ALTER TABLE zoal_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_homepage_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 1. Policies for zoal_subscribers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_subscribers' AND policyname = 'Public insert subscribers'
  ) THEN
    CREATE POLICY "Public insert subscribers" ON zoal_subscribers FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_subscribers' AND policyname = 'Staff manage subscribers'
  ) THEN
    CREATE POLICY "Staff manage subscribers" ON zoal_subscribers FOR ALL USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );
  END IF;

  -- 2. Policies for zoal_banners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_banners' AND policyname = 'Public read banners'
  ) THEN
    CREATE POLICY "Public read banners" ON zoal_banners FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_banners' AND policyname = 'Staff manage banners'
  ) THEN
    CREATE POLICY "Staff manage banners" ON zoal_banners FOR ALL USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );
  END IF;

  -- 3. Policies for zoal_cms_pages
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_cms_pages' AND policyname = 'Public read cms_pages'
  ) THEN
    CREATE POLICY "Public read cms_pages" ON zoal_cms_pages FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_cms_pages' AND policyname = 'Staff manage cms_pages'
  ) THEN
    CREATE POLICY "Staff manage cms_pages" ON zoal_cms_pages FOR ALL USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );
  END IF;

  -- 4. Policies for zoal_cms_sections
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_cms_sections' AND policyname = 'Public read cms_sections'
  ) THEN
    CREATE POLICY "Public read cms_sections" ON zoal_cms_sections FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_cms_sections' AND policyname = 'Staff manage cms_sections'
  ) THEN
    CREATE POLICY "Staff manage cms_sections" ON zoal_cms_sections FOR ALL USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );
  END IF;

  -- 5. Policies for zoal_homepage_blocks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_homepage_blocks' AND policyname = 'Public read homepage_blocks'
  ) THEN
    CREATE POLICY "Public read homepage_blocks" ON zoal_homepage_blocks FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'zoal_homepage_blocks' AND policyname = 'Staff manage homepage_blocks'
  ) THEN
    CREATE POLICY "Staff manage homepage_blocks" ON zoal_homepage_blocks FOR ALL USING (
      EXISTS (
        SELECT 1 FROM zoal_users WHERE id = auth.uid()::text AND role IN ('owner', 'admin', 'manager', 'staff')
      )
    );
  END IF;

END $$;
