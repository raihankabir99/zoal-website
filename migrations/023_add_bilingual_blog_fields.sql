-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - ENTERPRISE BLOG BILINGUAL SCHEMA EXPANSION
-- =========================================================================
-- Version: 023
-- Description: Adds Arabic translation columns (title_ar, content_ar, excerpt_ar) to zoal_blog_posts
--              and (meta_title_ar, meta_description_ar, og_title_ar, og_description_ar) to zoal_blog_seo
-- =========================================================================

-- Add Arabic fields to zoal_blog_posts
ALTER TABLE zoal_blog_posts ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE zoal_blog_posts ADD COLUMN IF NOT EXISTS content_ar TEXT;
ALTER TABLE zoal_blog_posts ADD COLUMN IF NOT EXISTS excerpt_ar TEXT;

-- Add Arabic fields to zoal_blog_seo
ALTER TABLE zoal_blog_seo ADD COLUMN IF NOT EXISTS meta_title_ar TEXT;
ALTER TABLE zoal_blog_seo ADD COLUMN IF NOT EXISTS meta_description_ar TEXT;
ALTER TABLE zoal_blog_seo ADD COLUMN IF NOT EXISTS og_title_ar TEXT;
ALTER TABLE zoal_blog_seo ADD COLUMN IF NOT EXISTS og_description_ar TEXT;
