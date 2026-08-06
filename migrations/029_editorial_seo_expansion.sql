-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - EDITORIAL LOOKBOOK SEO EXPANSION
-- =========================================================================
-- Version: 029
-- Description: Adds SEO and Metadata fields to zoal_homepage_editorial_blocks
-- =========================================================================

ALTER TABLE zoal_homepage_editorial_blocks 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_title_ar TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_description_ar TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords_ar TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS json_ld JSONB,
ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMP WITH TIME ZONE;
