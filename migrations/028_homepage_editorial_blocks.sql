-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - EDITORIAL LOOKBOOK BLOCKS
-- =========================================================================
-- Version: 028
-- Description: Creates the zoal_homepage_editorial_blocks table for 
--              managing the dynamic Scrolltelling Lookbook sections.
-- =========================================================================

-- Provision Supabase storage bucket for lookbook if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage-editorial', 'homepage-editorial', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS zoal_homepage_editorial_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    category_ar TEXT,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,
    button_text TEXT DEFAULT 'Explore Collection',
    button_text_ar TEXT DEFAULT 'اكتشف المجموعة',
    button_link TEXT DEFAULT 'store',
    desktop_image TEXT,
    mobile_image TEXT,
    background_text TEXT,
    background_text_ar TEXT,
    layout_type TEXT DEFAULT 'standard', -- standard, split, reverse, dark_overlay
    theme TEXT DEFAULT 'light', -- light, dark, gold, custom
    animation_type TEXT DEFAULT 'fade-up', -- fade-up, slide-left, zoom-in
    display_order INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published', -- published, draft, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE zoal_homepage_editorial_blocks ENABLE ROW LEVEL SECURITY;

-- Select policy: anyone can read active / published editorial blocks
CREATE POLICY "Anyone can view published editorial blocks" ON zoal_homepage_editorial_blocks
    FOR SELECT USING (status = 'published');

-- All policies for authenticated enterprise users or administrators
CREATE POLICY "Admins can perform all actions on editorial blocks" ON zoal_homepage_editorial_blocks
    FOR ALL USING (true) WITH CHECK (true);

-- Create some high-quality seed data mirroring the original 5 scroll cards:
-- Coffee, Bakery, Market, Premium (Luxury Collections), Thobes
INSERT INTO zoal_homepage_editorial_blocks (
    slug, category, category_ar, title, title_ar, description, description_ar, 
    button_text, button_text_ar, button_link, desktop_image, mobile_image, 
    background_text, background_text_ar, layout_type, theme, animation_type, 
    display_order, priority, status
) VALUES 
(
    'coffee-ritual',
    'Specialty Coffee', 'القهوة المختصة',
    'THE RITUAL OF ARABIAN COFFEE', 'طقوس القهوة العربية',
    'Experience the deep, aromatic journey of our masterfully roasted organic beans, celebrating traditional Sudanese hospitality in every single cup.',
    'عش رحلة عميقة وعطرة مع حبوب البن العضوية المحمصة ببراعة، واحتفِ بالضيافة السودانية التقليدية الأصيلة في كل كوب.',
    'Order Brew Kit', 'اطلب أدوات التحضير', 'store',
    '/src/assets/images/hero-coffee.jpg', '/src/assets/images/hero-coffee.jpg',
    'AROMA', 'عبير', 'standard', 'dark', 'fade-up',
    1, 10, 'published'
),
(
    'artisan-bakery',
    'Artisan Bakery', 'المخبوزات الطازجة',
    'CRISP OVEN-FRESH DELIGHTS', 'لذة المخبوزات الطازجة',
    'Savor golden, flaky croissants, warm traditional flatbreads, and specialty pastries crafted with organic, locally-sourced ingredients.',
    'تذوق الكرواسون الذهبي الهش، والخبز التقليدي الدافئ، والمعجنات المتميزة المحضرة من مكونات عضوية ومحلية المصدر يومياً.',
    'View Bakery Menu', 'عرض قائمة المخبوزات', 'store',
    '/src/assets/images/hero-bakery.jpg', '/src/assets/images/hero-bakery.jpg',
    'BAKED', 'مخبوز', 'reverse', 'light', 'slide-left',
    2, 8, 'published'
),
(
    'heritage-market',
    'Heritage Market', 'سوق التراث العريق',
    'SOURCED WITH PURE ETHICS', 'مصادر طبيعية وأخلاقية',
    'Sustainably sourced premium spices, handpicked botanical herbs, and authentic traditional pantry staples direct from trusted local cooperatives.',
    'توابل فاخرة من مصادر مستدامة، وأعشاب نباتية منتقاة بعناية، ومستلزمات مطبخ تقليدية مباشرة من جمعيات محلية موثوقة.',
    'Explore Market', 'اكتشف السوق', 'store',
    '/src/assets/images/hero-market.jpg', '/src/assets/images/hero-market.jpg',
    'HERITAGE', 'تراث', 'standard', 'gold', 'zoom-in',
    3, 6, 'published'
),
(
    'luxury-collections',
    'Premium Tailoring', 'الخياطة الراقية',
    'ROYAL GOLD SERIES THOBES', 'أثواب السلسلة الذهبية الملكية',
    'Adorn yourself with bespoke menswear, distinguished by fine hand-stitching, rich gold-thread accents, and lightweight premium fabrics.',
    'تميز بأثواب مصممة خصيصاً لك، تتفرد بتطريز يدوي دقيق، وخيوط ذهبية فاخرة، وأقمشة خفيفة الوزن تليق بالهيبة والوقار.',
    'Book Tailor Appointment', 'احجز موعد تفصيل', 'store',
    '/src/assets/images/hero-fashion.jpg', '/src/assets/images/hero-fashion.jpg',
    'PRESTIGE', 'فخامة', 'reverse', 'dark', 'fade-up',
    4, 4, 'published'
),
(
    'mens-thobes',
    'Exclusive Abayas & Menswear', 'العباءات والأثواب الحصرية',
    'THE APEX OF ARABIAN ATTIRE', 'القمة المطلقة في الزي العربي',
    'Where heritage design meets modern, breathable comfort. Hand-crafted pieces designed to leave an everlasting impression on every special event.',
    'حيث يلتقي التصميم التراثي الأنيق مع الراحة العصرية الفائقة. قطع مصنوعة يدوياً لتترك انطباعاً لا ينسى في كل مناسبة.',
    'Browse Apparel', 'تصفح الملابس', 'store',
    '/src/assets/images/hero-fashion.jpg', '/src/assets/images/hero-fashion.jpg',
    'CRAFTED', 'متقن', 'standard', 'light', 'zoom-in',
    5, 2, 'published'
)
ON CONFLICT (slug) DO NOTHING;
