-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - CMS MANAGEMENT SCHEMA
-- =========================================================================
-- Version: 010
-- Description: Creates CMS tables: zoal_cms_pages, zoal_cms_sections,
--              zoal_banners, zoal_homepage_blocks.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_cms_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_json JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_cms_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES zoal_cms_pages(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  content_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_homepage_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_type TEXT NOT NULL,
  title TEXT,
  content_json JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_homepage_blocks ENABLE ROW LEVEL SECURITY;
