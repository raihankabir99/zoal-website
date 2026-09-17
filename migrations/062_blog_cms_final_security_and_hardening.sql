-- 062_blog_cms_final_security_and_hardening.sql
-- FINAL AUDIT & HARDENING FOR ZOAL BLOG / CMS SYSTEM

-- 1. SECURE SEARCH_PATH ON ALL BLOG PLPGSQL FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_blog_staff_role()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff', 'editor', 'author');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE zoal_blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM authenticated;

-- 2. HARDEN ANALYTICS VIEW WITH SECURITY INVOKER
DROP VIEW IF EXISTS public.zoal_v_blog_analytics;

CREATE OR REPLACE VIEW public.zoal_v_blog_analytics
WITH (security_invoker = true) AS
SELECT 
  p.id AS post_id,
  p.title,
  p.slug,
  p.view_count,
  p.like_count,
  COUNT(DISTINCT c.id) AS comment_count,
  p.published_at,
  p.status
FROM zoal_blog_posts p
LEFT JOIN zoal_blog_comments c ON c.post_id = p.id AND c.status = 'approved'
GROUP BY p.id, p.title, p.slug, p.view_count, p.like_count, p.published_at, p.status;

-- 3. COMPLETE RLS MATRIX FOR BLOG TABLES
ALTER TABLE public.zoal_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoal_blog_seo ENABLE ROW LEVEL SECURITY;

-- zoal_blog_posts policies
DROP POLICY IF EXISTS "Public select published blog posts" ON public.zoal_blog_posts;
DROP POLICY IF EXISTS "Staff manage blog posts" ON public.zoal_blog_posts;

CREATE POLICY "Public select published blog posts" ON public.zoal_blog_posts
  FOR SELECT
  USING (
    status = 'published' OR 
    (auth.uid() IS NOT NULL AND public.is_blog_staff_role())
  );

CREATE POLICY "Staff manage blog posts" ON public.zoal_blog_posts
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- zoal_blog_comments policies
DROP POLICY IF EXISTS "Select comments" ON public.zoal_blog_comments;
DROP POLICY IF EXISTS "Anyone create comments" ON public.zoal_blog_comments;
DROP POLICY IF EXISTS "Users update own comments" ON public.zoal_blog_comments;
DROP POLICY IF EXISTS "Staff delete comments" ON public.zoal_blog_comments;

CREATE POLICY "Select comments" ON public.zoal_blog_comments
  FOR SELECT
  USING (
    status = 'approved' OR
    (auth.uid() IS NOT NULL AND (auth.uid()::text = created_by OR public.is_blog_staff_role()))
  );

CREATE POLICY "Anyone create comments" ON public.zoal_blog_comments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users update own comments" ON public.zoal_blog_comments
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = created_by) OR 
    (auth.uid() IS NOT NULL AND public.is_blog_staff_role())
  );

CREATE POLICY "Staff delete comments" ON public.zoal_blog_comments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- zoal_blog_schedules policies
DROP POLICY IF EXISTS "Staff manage schedules" ON public.zoal_blog_schedules;

CREATE POLICY "Staff manage schedules" ON public.zoal_blog_schedules
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- zoal_blog_views policies
DROP POLICY IF EXISTS "Staff select views" ON public.zoal_blog_views;

CREATE POLICY "Staff select views" ON public.zoal_blog_views
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND public.is_blog_staff_role()
  );

-- zoal_blog_likes policies
DROP POLICY IF EXISTS "Public select likes" ON public.zoal_blog_likes;
DROP POLICY IF EXISTS "Public manage likes" ON public.zoal_blog_likes;

CREATE POLICY "Public select likes" ON public.zoal_blog_likes
  FOR SELECT USING (true);

CREATE POLICY "Public manage likes" ON public.zoal_blog_likes
  FOR ALL USING (true) WITH CHECK (true);
