-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - ENTERPRISE BLOG & NEWS CMS
-- =========================================================================
-- Version: 021
-- Description: Comprehensive Enterprise Blog Platform (Shopify + WP + Ghost grade)
-- Tables: posts, categories, tags, post_tags, authors, comments, media, seo,
--         views, likes, newsletters, revisions, schedules, settings, audit_logs.
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BLOG CATEGORIES
CREATE TABLE IF NOT EXISTS zoal_blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES zoal_blog_categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BLOG TAGS
CREATE TABLE IF NOT EXISTS zoal_blog_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BLOG AUTHORS
CREATE TABLE IF NOT EXISTS zoal_blog_authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BLOG POSTS
CREATE TABLE IF NOT EXISTS zoal_blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_json JSONB DEFAULT '{}',
  featured_image TEXT,
  gallery_images JSONB DEFAULT '[]',
  author_id UUID REFERENCES zoal_blog_authors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES zoal_blog_categories(id) ON DELETE SET NULL,
  reading_time INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT FALSE,
  allow_comments BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BLOG POST TAGS (Many-to-Many)
CREATE TABLE IF NOT EXISTS zoal_blog_post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES zoal_blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES zoal_blog_tags(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

-- 6. BLOG COMMENTS
CREATE TABLE IF NOT EXISTS zoal_blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES zoal_blog_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES zoal_blog_comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BLOG MEDIA
CREATE TABLE IF NOT EXISTS zoal_blog_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  bucket_name TEXT DEFAULT 'blog-images',
  status TEXT DEFAULT 'active',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BLOG SEO
CREATE TABLE IF NOT EXISTS zoal_blog_seo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES zoal_blog_posts(id) ON DELETE CASCADE UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  status TEXT DEFAULT 'active',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BLOG VIEWS
CREATE TABLE IF NOT EXISTS zoal_blog_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES zoal_blog_posts(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BLOG LIKES
CREATE TABLE IF NOT EXISTS zoal_blog_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES zoal_blog_posts(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BLOG NEWSLETTERS
CREATE TABLE IF NOT EXISTS zoal_blog_newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  subscribed BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BLOG REVISIONS
CREATE TABLE IF NOT EXISTS zoal_blog_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES zoal_blog_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  revision_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. BLOG SCHEDULES
CREATE TABLE IF NOT EXISTS zoal_blog_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES zoal_blog_posts(id) ON DELETE CASCADE,
  scheduled_publish_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. BLOG SETTINGS
CREATE TABLE IF NOT EXISTS zoal_blog_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. BLOG AUDIT LOGS
CREATE TABLE IF NOT EXISTS zoal_blog_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  actor TEXT,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success',
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON zoal_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON zoal_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON zoal_blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON zoal_blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON zoal_blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_seo_post ON zoal_blog_seo(post_id);

-- VIEWS FOR ENTERPRISE ANALYTICS
CREATE OR REPLACE VIEW zoal_v_blog_analytics AS
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

-- FUNCTIONS & TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_blog_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_zoal_blog_posts_modtime
  BEFORE UPDATE ON zoal_blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();

CREATE TRIGGER update_zoal_blog_categories_modtime
  BEFORE UPDATE ON zoal_blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE zoal_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_blog_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Guest, Customer, Author, Editor, Manager, Admin, Owner)
CREATE POLICY "Public read published blog posts" ON zoal_blog_posts
  FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);

CREATE POLICY "Staff manage blog posts" ON zoal_blog_posts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read categories" ON zoal_blog_categories FOR SELECT USING (true);
CREATE POLICY "Staff manage categories" ON zoal_blog_categories FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read tags" ON zoal_blog_tags FOR SELECT USING (true);
CREATE POLICY "Staff manage tags" ON zoal_blog_tags FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read comments" ON zoal_blog_comments FOR SELECT USING (status = 'approved' OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated create comments" ON zoal_blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff manage comments" ON zoal_blog_comments FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read seo" ON zoal_blog_seo FOR SELECT USING (true);
CREATE POLICY "Staff manage seo" ON zoal_blog_seo FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read authors" ON zoal_blog_authors FOR SELECT USING (true);
CREATE POLICY "Staff manage authors" ON zoal_blog_authors FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff manage media" ON zoal_blog_media FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Public read media" ON zoal_blog_media FOR SELECT USING (true);

CREATE POLICY "Staff manage newsletters" ON zoal_blog_newsletters FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Public subscribe newsletters" ON zoal_blog_newsletters FOR INSERT WITH CHECK (true);

-- STORAGE BUCKETS REGISTRATION
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('blog-images', 'blog-images', true),
  ('blog-gallery', 'blog-gallery', true),
  ('blog-files', 'blog-files', true),
  ('blog-covers', 'blog-covers', true)
ON CONFLICT (id) DO NOTHING;
