-- 037_blog_authors_compatibility.sql
-- Production-safe compatibility migration for bilingual blog author fields.
-- Adds only nullable columns; does not remove, rename, or alter existing data.

ALTER TABLE public.zoal_blog_authors
  ADD COLUMN IF NOT EXISTS name_ar TEXT;

ALTER TABLE public.zoal_blog_authors
  ADD COLUMN IF NOT EXISTS bio_ar TEXT;

ALTER TABLE public.zoal_blog_authors
  ADD COLUMN IF NOT EXISTS expertise_ar TEXT;

-- 035 uses this SECURITY DEFINER helper from RLS policies. Keep execution
-- available to public API roles so published-blog reads do not fail when the
-- policy expression is evaluated.
GRANT EXECUTE ON FUNCTION public.is_blog_staff_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_blog_staff_role() TO authenticated;
