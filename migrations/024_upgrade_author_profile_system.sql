-- Upgrade Author Profile System Columns
ALTER TABLE zoal_blog_authors ADD COLUMN IF NOT EXISTS expertise TEXT;
ALTER TABLE zoal_blog_authors ADD COLUMN IF NOT EXISTS joined_date TIMESTAMPTZ DEFAULT NOW();
