-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - ENTERPRISE AI TRANSLATION REVIEW CENTER
-- =========================================================================
-- Version: 025
-- Description: Creates first-class tables for tracking AI-generated translations,
--              their edit histories, approval workflows, and audit logs.
-- =========================================================================

-- 1. Create translations queue table
CREATE TABLE IF NOT EXISTS zoal_ai_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'Product', 'Category', 'Brand', 'Blog Post', 'CMS Page', 'FAQ', 'Policy', 'Collection', 'Banner'
  entity_id TEXT NOT NULL, -- Target item reference UUID or Slug
  entity_name TEXT NOT NULL, -- Human-friendly name of the entity being translated
  field_name TEXT NOT NULL, -- 'name', 'description', 'title', 'content', 'excerpt', 'meta_title', 'meta_description'
  source_lang TEXT NOT NULL DEFAULT 'en',
  target_lang TEXT NOT NULL DEFAULT 'ar',
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL, -- Initial AI output
  edited_text TEXT, -- Current active draft text
  status TEXT NOT NULL DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'EDITED', 'WAITING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED')),
  version INTEGER NOT NULL DEFAULT 1,
  reviewer_notes TEXT,
  created_by TEXT DEFAULT 'Gemini AI',
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create translation versions history table
CREATE TABLE IF NOT EXISTS zoal_ai_translation_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  translation_id UUID NOT NULL REFERENCES zoal_ai_translations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  edited_text TEXT NOT NULL,
  edited_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create translation audit logs table
CREATE TABLE IF NOT EXISTS zoal_ai_translation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  translation_id UUID REFERENCES zoal_ai_translations(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'GENERATE', 'EDIT', 'SUBMIT_REVIEW', 'APPROVE', 'PUBLISH', 'REJECT', 'ROLLBACK'
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Finished table schema definition

