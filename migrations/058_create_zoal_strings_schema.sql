-- =========================================================================
-- ZOAL ENTERPRISE PLATFORM — GLOBAL TEXTS & TRANSLATIONS
-- Migration 058: Global UI String Registry
--
-- Additive / non-destructive only.
-- This migration creates the isolated registry for CMS-managed global
-- UI and short marketing strings. Existing CMS/entity tables remain intact.
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_strings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  locale TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ui',
  status TEXT NOT NULL DEFAULT 'draft',
  is_html BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT zoal_strings_key_locale_unique UNIQUE (key, locale),
  CONSTRAINT zoal_strings_locale_check CHECK (locale IN ('en', 'ar')),
  CONSTRAINT zoal_strings_status_check CHECK (status IN ('draft', 'published')),
  CONSTRAINT zoal_strings_category_check CHECK (category IN ('ui', 'marketing'))
);

CREATE INDEX IF NOT EXISTS idx_zoal_strings_status_locale
  ON zoal_strings (status, locale);

CREATE INDEX IF NOT EXISTS idx_zoal_strings_category
  ON zoal_strings (category);

ALTER TABLE zoal_strings ENABLE ROW LEVEL SECURITY;

-- Public storefront access is limited to published strings.
DROP POLICY IF EXISTS "zoal_strings_public_published_select" ON zoal_strings;
CREATE POLICY "zoal_strings_public_published_select"
  ON zoal_strings
  FOR SELECT
  USING (status = 'published');

-- CMS writes remain intentionally restricted to the existing authenticated
-- application security model. Application-layer authorization must be added
-- with the Texts API in the next phase; no public write policy is created here.

COMMENT ON TABLE zoal_strings IS
  'CMS-managed global UI and short marketing strings; existing domain content remains in its owning tables.';
COMMENT ON COLUMN zoal_strings.key IS
  'Stable i18next-compatible key, e.g. nav.home.';
COMMENT ON COLUMN zoal_strings.locale IS
  'Supported locale: en or ar.';
COMMENT ON COLUMN zoal_strings.status IS
  'Publication state: draft or published.';
COMMENT ON COLUMN zoal_strings.is_html IS
  'Metadata flag only; rendering/sanitization is handled by a later application layer.';
