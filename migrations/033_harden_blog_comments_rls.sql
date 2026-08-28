-- 033_harden_blog_comments_rls.sql
-- MASTER PRODUCTION SECURITY HARDENING: zoal_blog_comments RLS POLICIES

-- 1. Helper function for blog staff/moderation roles
-- Uses SECURITY DEFINER to safely inspect zoal_users role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_blog_staff_role()
RETURNS boolean AS $$
BEGIN
  RETURN public.get_auth_user_role() IN ('owner', 'admin', 'manager', 'staff', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop all legacy/insecure comment policies
DROP POLICY IF EXISTS "Public read comments" ON zoal_blog_comments;
DROP POLICY IF EXISTS "Authenticated create comments" ON zoal_blog_comments;
DROP POLICY IF EXISTS "Staff manage comments" ON zoal_blog_comments;
DROP POLICY IF EXISTS "zoal_blog_comments_select_policy" ON zoal_blog_comments;
DROP POLICY IF EXISTS "zoal_blog_comments_insert_policy" ON zoal_blog_comments;
DROP POLICY IF EXISTS "zoal_blog_comments_update_policy" ON zoal_blog_comments;
DROP POLICY IF EXISTS "zoal_blog_comments_delete_policy" ON zoal_blog_comments;

-- Ensure Row Level Security is enabled
ALTER TABLE zoal_blog_comments ENABLE ROW LEVEL SECURITY;

-- 3. SELECT Policy:
-- - Anyone (public) can read approved comments.
-- - Authenticated users can read their own comments (created_by = auth.uid()::text).
-- - Staff/Editors can read all comments.
-- NOTE: author_email is NEVER used as authorization identity.
CREATE POLICY "zoal_blog_comments_select_policy" ON zoal_blog_comments
  FOR SELECT
  USING (
    status = 'approved'
    OR (
      auth.uid() IS NOT NULL AND (
        created_by = auth.uid()::text
        OR public.is_blog_staff_role()
      )
    )
  );

-- 4. INSERT Policy:
-- - Requires authenticated user (auth.uid() IS NOT NULL).
-- - Customers MUST set created_by = auth.uid()::text and status = 'pending'.
-- - Staff/Editors can insert comments as staff.
CREATE POLICY "zoal_blog_comments_insert_policy" ON zoal_blog_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      (created_by = auth.uid()::text AND (status IS NULL OR status = 'pending'))
      OR public.is_blog_staff_role()
    )
  );

-- 5. UPDATE Policy:
-- - Customers can update ONLY their own comments where created_by = auth.uid()::text.
-- - WITH CHECK guarantees created_by cannot be changed away from auth.uid()::text and status cannot be escalated.
-- - Staff/Editors can update any comment and change status.
CREATE POLICY "zoal_blog_comments_update_policy" ON zoal_blog_comments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid()::text
      OR public.is_blog_staff_role()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      (created_by = auth.uid()::text AND (status IS NULL OR status = 'pending'))
      OR public.is_blog_staff_role()
    )
  );

-- 6. DELETE Policy:
-- - Customers can delete ONLY their own comments where created_by = auth.uid()::text.
-- - Staff/Editors can delete any comment.
CREATE POLICY "zoal_blog_comments_delete_policy" ON zoal_blog_comments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid()::text
      OR public.is_blog_staff_role()
    )
  );
