-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - LEGAL POLICY SCHEMA
-- =========================================================================
-- Version: 012
-- Description: Creates Legal Policy tables: zoal_legal_documents,
--              zoal_legal_document_versions.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  current_version_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zoal_legal_document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES zoal_legal_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE zoal_legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_legal_document_versions ENABLE ROW LEVEL SECURITY;
