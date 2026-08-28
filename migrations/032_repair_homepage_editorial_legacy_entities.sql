-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - REPAIR EDITORIAL LOOKBOOK LEGACY ENTITIES
-- =========================================================================
-- Version: 032
-- Description: One-time migration to decode legacy HTML entities in text columns
--              of zoal_homepage_editorial_blocks without affecting IDs, images,
--              slugs, or non-text configuration metadata.
-- =========================================================================

-- Ensure columns exist safely
ALTER TABLE zoal_homepage_editorial_blocks 
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS subtitle_ar TEXT;

-- Helper function for decoding HTML entities
CREATE OR REPLACE FUNCTION zoal_decode_html_entities(str TEXT) 
RETURNS TEXT AS $$
BEGIN
  IF str IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Double-encoded and compound entities
  str := REPLACE(str, '&amp;amp;', '&');
  str := REPLACE(str, '&amp;#x27;', '''');
  str := REPLACE(str, '&amp;#39;', '''');
  str := REPLACE(str, '&amp;quot;', '"');
  str := REPLACE(str, '&amp;lt;', '<');
  str := REPLACE(str, '&amp;gt;', '>');
  str := REPLACE(str, '&amp;#x2F;', '/');

  -- 2. Standard single-encoded HTML entities
  str := REPLACE(str, '&amp;', '&');
  str := REPLACE(str, '&#x27;', '''');
  str := REPLACE(str, '&#39;', '''');
  str := REPLACE(str, '&quot;', '"');
  str := REPLACE(str, '&lt;', '<');
  str := REPLACE(str, '&gt;', '>');
  str := REPLACE(str, '&#x2F;', '/');
  str := REPLACE(str, '&nbsp;', ' ');

  -- 3. Second-pass safety check for residual nested encodings
  str := REPLACE(str, '&amp;', '&');
  str := REPLACE(str, '&#x27;', '''');
  str := REPLACE(str, '&#39;', '''');
  str := REPLACE(str, '&quot;', '"');
  str := REPLACE(str, '&lt;', '<');
  str := REPLACE(str, '&gt;', '>');

  RETURN str;
END;
$$ LANGUAGE plpgsql;

-- Apply decoding to target text columns in zoal_homepage_editorial_blocks
UPDATE zoal_homepage_editorial_blocks
SET
  category           = zoal_decode_html_entities(category),
  category_ar        = zoal_decode_html_entities(category_ar),
  title              = zoal_decode_html_entities(title),
  title_ar           = zoal_decode_html_entities(title_ar),
  subtitle           = zoal_decode_html_entities(subtitle),
  subtitle_ar        = zoal_decode_html_entities(subtitle_ar),
  description        = zoal_decode_html_entities(description),
  description_ar     = zoal_decode_html_entities(description_ar),
  button_text        = zoal_decode_html_entities(button_text),
  button_text_ar     = zoal_decode_html_entities(button_text_ar),
  background_text    = zoal_decode_html_entities(background_text),
  background_text_ar = zoal_decode_html_entities(background_text_ar);

-- Clean up temporary helper function
DROP FUNCTION IF EXISTS zoal_decode_html_entities(TEXT);
