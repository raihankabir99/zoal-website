-- 034_blog_views_and_scheduling.sql
-- MASTER PRODUCTION DATABASE WORK: BLOG VIEWS & SCHEDULING ENHANCEMENTS

-- 1. Alter status check constraint on zoal_blog_schedules
ALTER TABLE zoal_blog_schedules DROP CONSTRAINT IF EXISTS zoal_blog_schedules_status_check;
ALTER TABLE zoal_blog_schedules ADD CONSTRAINT zoal_blog_schedules_status_check CHECK (status IN ('pending', 'executed', 'failed', 'cancelled'));

-- 2. Add retry_count and error_message columns to zoal_blog_schedules
ALTER TABLE zoal_blog_schedules ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE zoal_blog_schedules ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. Create increment_view_count PostgreSQL function for high performance and race condition safety
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE zoal_blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure the RPC function: Revoke direct execution from public, anon, and authenticated roles
-- Only the secure Express backend using getServiceSupabaseClient() (which has service_role) can invoke this rpc.
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM authenticated;

-- 5. Set up RLS for zoal_blog_views to protect from any unauthorized direct client manipulations
ALTER TABLE zoal_blog_views ENABLE ROW LEVEL SECURITY;

-- Drop legacy view policies if any exist
DROP POLICY IF EXISTS "Public select views" ON zoal_blog_views;
DROP POLICY IF EXISTS "Staff manage views" ON zoal_blog_views;

-- Allow only staff (privileged blog roles) to select view records directly, no direct insert/update/delete allowed for customers.
CREATE POLICY "Staff select views" ON zoal_blog_views
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_blog_staff_role()
    )
  );
