-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - AI WORKSPACE SCHEMA
-- =========================================================================
-- Version: 014
-- Description: Creates Enterprise AI Workspace tables:
--              zoal_ai_history, zoal_ai_prompts, zoal_ai_outputs,
--              zoal_ai_usage, zoal_ai_templates.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_ai_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES zoal_ai_prompts(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES zoal_ai_prompts(id) ON DELETE CASCADE,
  tokens INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  time_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_ai_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Product', 'SEO', 'Translation'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_ai_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- e.g., 'ProductGen', 'SEOGen', 'Translation'
  meta_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_ai_history ENABLE ROW LEVEL SECURITY;
