-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - HERO SEO EXPANSION
-- =========================================================================
-- Version: 027
-- Description: Adds additional advanced SEO metadata columns to the 
--              zoal_homepage_heroes table.
-- =========================================================================

ALTER TABLE zoal_homepage_heroes ADD COLUMN IF NOT EXISTS seo_og_image TEXT;
ALTER TABLE zoal_homepage_heroes ADD COLUMN IF NOT EXISTS seo_og_image_ar TEXT;
ALTER TABLE zoal_homepage_heroes ADD COLUMN IF NOT EXISTS seo_twitter_image TEXT;
ALTER TABLE zoal_homepage_heroes ADD COLUMN IF NOT EXISTS seo_twitter_image_ar TEXT;
ALTER TABLE zoal_homepage_heroes ADD COLUMN IF NOT EXISTS seo_json_ld TEXT;
ALTER TABLE zoal_homepage_heroes ADD COLUMN IF NOT EXISTS seo_canonical_url TEXT;
