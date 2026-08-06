-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - ENTERPRISE BLOG MEDIA SCHEMA EXPANSION
-- =========================================================================
-- Version: 022
-- Description: Adds alt_text, caption, original_url, and webp_url to zoal_blog_media table
-- =========================================================================

ALTER TABLE zoal_blog_media ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE zoal_blog_media ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE zoal_blog_media ADD COLUMN IF NOT EXISTS original_url TEXT;
ALTER TABLE zoal_blog_media ADD COLUMN IF NOT EXISTS webp_url TEXT;
