-- 035_blog_production_hardening.sql
-- MASTER PRODUCTION DATABASE WORK: BLOG SECURITY & RLS HARDENING

-- 1. Tighten zoal_blog_posts RLS
-- Drop legacy policies
DROP POLICY IF EXISTS "Public read published blog posts" ON zoal_blog_posts;
DROP POLICY IF EXISTS "Staff manage blog posts" ON zoal_blog_posts;

-- NEW SELECT: Non-staff see only published. Staff see everything.
CREATE POLICY "Public select published blog posts" ON zoal_blog_posts
  FOR SELECT
  USING (
    status = 'published' OR 
    (auth.uid() IS NOT NULL AND public.is_blog_staff_role())
  );

-- NEW MANAGE: Only staff can INSERT/UPDATE/DELETE
CREATE POLICY "Staff manage blog posts" ON zoal_blog_posts
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- 2. Secure zoal_blog_schedules RLS
ALTER TABLE zoal_blog_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage schedules" ON zoal_blog_schedules;

CREATE POLICY "Staff manage schedules" ON zoal_blog_schedules
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- 3. Secure zoal_blog_views RLS
-- Revoke direct insert from everyone; only the service role (backend) should insert views
-- We do this by ensuring the policy requires service_role or just staff access for auditing.
ALTER TABLE zoal_blog_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff select views" ON zoal_blog_views;
DROP POLICY IF EXISTS "Allow service role insert views" ON zoal_blog_views;

-- Only staff can see view logs
CREATE POLICY "Staff select views" ON zoal_blog_views
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- Only service role can insert (handled implicitly if no INSERT policy exists for public/anon/auth)
-- But we can add a service role policy for clarity if needed.

-- 4. Secure zoal_blog_comments RLS
-- Tighten to ensure people can't manipulate others' comments if they aren't staff
DROP POLICY IF EXISTS "Authenticated create comments" ON zoal_blog_comments;
DROP POLICY IF EXISTS "Staff manage comments" ON zoal_blog_comments;

CREATE POLICY "Anyone create comments" ON zoal_blog_comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users update own comments" ON zoal_blog_comments
  FOR UPDATE
  USING (
    auth.uid()::text = created_by OR 
    (auth.uid() IS NOT NULL AND public.is_blog_staff_role())
  );

CREATE POLICY "Staff delete comments" ON zoal_blog_comments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- 5. Helper Check (Ensure is_blog_staff_role exists and is robust)
CREATE OR REPLACE FUNCTION public.is_blog_staff_role()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff', 'editor', 'author');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
