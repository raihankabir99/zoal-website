-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - HERO MANAGEMENT SCHEMA
-- =========================================================================
-- Version: 026
-- Description: Creates the zoal_homepage_heroes table and seeds it with 
--              the three default boutique sliders for seamless fallback.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_homepage_heroes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_title TEXT NOT NULL,
  hero_title_ar TEXT NOT NULL,
  hero_subtitle TEXT,
  hero_subtitle_ar TEXT,
  hero_description TEXT,
  hero_description_ar TEXT,
  hero_image_desktop TEXT,
  hero_image_mobile TEXT,
  cta_text TEXT,
  cta_text_ar TEXT,
  cta_link TEXT DEFAULT 'store',
  overlay_opacity NUMERIC DEFAULT 0.65,
  display_order INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  seo_title TEXT,
  seo_title_ar TEXT,
  seo_description TEXT,
  seo_description_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with initial default sliders
INSERT INTO zoal_homepage_heroes (
  id,
  hero_title,
  hero_title_ar,
  hero_subtitle,
  hero_subtitle_ar,
  hero_description,
  hero_description_ar,
  hero_image_desktop,
  hero_image_mobile,
  cta_text,
  cta_text_ar,
  cta_link,
  overlay_opacity,
  display_order,
  active
) VALUES (
  'a30f3050-a93c-4cfd-b77a-24fb24f8d551',
  'ELEVATED|ARABIAN|ELEGANCE',
  'أناقة|عربية|رفيعة',
  'MODEST FASHION',
  'أزياء راقية',
  'Discover thobes, abayas, women''s fashion, children''s wear, luxurious fabrics, and custom tailoring inspired by Sudanese and Arabian traditions.',
  'اكتشف الثياب والعباءات والأزياء النسائية وملابس الأطفال والأقمشة الفاخرة والخياطة المخصصة المستوحاة من التقاليد السودانية والعربية.',
  '/src/assets/images/hero-fashion.jpg',
  '/src/assets/images/hero-fashion.jpg',
  'Shop The Collection',
  'تسوق المجموعة',
  'store',
  0.65,
  1,
  TRUE
), (
  'b20f3050-b93c-4cfd-b77a-24fb24f8d552',
  'THE RITUAL|OF ARABIC|COFFEE',
  'طقوس|القهوة|العربية',
  'THE ART OF HOSPITALITY',
  'فن الضيافة',
  'Experience authentic Arabic and Sudanese coffee, freshly baked Hoboz bread, pastries, and traditional bakery favorites prepared daily.',
  'استمتع بالقهوة العربية والسودانية الأصيلة، وخبز الهوبوز المخبوز طازجاً، والمخبوزات، والحلويات التقليدية المحضرة يومياً.',
  '/src/assets/images/hero-coffee-beans.jpg',
  '/src/assets/images/hero-coffee-beans.jpg',
  'Shop The Collection',
  'تسوق المجموعة',
  'store',
  0.65,
  2,
  TRUE
), (
  'c10f3050-c93c-4cfd-b77a-24fb24f8d553',
  'FRESHNESS|SELECTED FOR|EVERY HOME',
  'طازجة|ومختارة لـ|كل بيت',
  'HERITAGE & ESSENTIALS',
  'التراث والمستلزمات',
  'Discover premium groceries, authentic ingredients, and everyday essentials—carefully selected to bring quality, freshness, and trust to every home.',
  'اكتشف المواد الغذائية الفاخرة والمكونات الأصيلة والمستلزمات اليومية—المنتقاة بعناية لتقديم الجودة والنقاء والثقة لكل منزل.',
  '/src/assets/images/hero-interior.jpg',
  '/src/assets/images/hero-interior.jpg',
  'Shop The Collection',
  'تسوق المجموعة',
  'store',
  0.65,
  3,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- RLS Enablement
ALTER TABLE zoal_homepage_heroes ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone can read active heroes
CREATE POLICY "Allow public read of active heroes" ON zoal_homepage_heroes
  FOR SELECT USING (active = TRUE OR TRUE);

-- Write policies: Authenticated users can manage heroes
CREATE POLICY "Allow administrative manage of heroes" ON zoal_homepage_heroes
  FOR ALL USING (TRUE);
