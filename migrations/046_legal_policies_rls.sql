-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - LEGAL RLS SECURITY HARDENING
-- =========================================================================
-- Version: 046
-- Description: Least-privilege RLS policies for legal documents and versions.
--              Public reads are limited to published legal content. Admin
--              mutations are aligned with the application RBAC model.
-- =========================================================================

ALTER TABLE zoal_legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoal_legal_document_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public select of documents" ON zoal_legal_documents;
  DROP POLICY IF EXISTS "Allow public select of published documents" ON zoal_legal_documents;
  DROP POLICY IF EXISTS "Staff manage legal documents" ON zoal_legal_documents;
  DROP POLICY IF EXISTS "Privileged select legal documents" ON zoal_legal_documents;
  DROP POLICY IF EXISTS "Privileged insert legal documents" ON zoal_legal_documents;
  DROP POLICY IF EXISTS "Privileged update legal documents" ON zoal_legal_documents;
  DROP POLICY IF EXISTS "Privileged delete legal documents" ON zoal_legal_documents;

  DROP POLICY IF EXISTS "Allow public select of published versions" ON zoal_legal_document_versions;
  DROP POLICY IF EXISTS "Staff manage legal versions" ON zoal_legal_document_versions;
  DROP POLICY IF EXISTS "Privileged select legal versions" ON zoal_legal_document_versions;
  DROP POLICY IF EXISTS "Privileged insert legal versions" ON zoal_legal_document_versions;
  DROP POLICY IF EXISTS "Privileged update legal drafts" ON zoal_legal_document_versions;
  DROP POLICY IF EXISTS "Privileged delete legal drafts" ON zoal_legal_document_versions;

  -- Public can only discover document definitions that have at least one
  -- published version. This prevents unpublished document metadata leakage.
  CREATE POLICY "Allow public select of published documents" ON zoal_legal_documents
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM zoal_legal_document_versions v
        WHERE v.document_id = zoal_legal_documents.id
          AND v.status = 'Published'
      )
    );

  -- Authorized Legal operators use the existing ZOAL RBAC role model.
  CREATE POLICY "Privileged select legal documents" ON zoal_legal_documents
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
    );

  CREATE POLICY "Privileged insert legal documents" ON zoal_legal_documents
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
    );

  CREATE POLICY "Privileged update legal documents" ON zoal_legal_documents
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
    );

  -- A document containing a published version must not be destructively
  -- removed through the normal authenticated Supabase path.
  CREATE POLICY "Privileged delete legal documents" ON zoal_legal_documents
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM zoal_legal_document_versions v
        WHERE v.document_id = zoal_legal_documents.id
          AND v.status = 'Published'
      )
    );

  -- Anonymous/public users can read published legal versions only.
  CREATE POLICY "Allow public select of published versions" ON zoal_legal_document_versions
    FOR SELECT
    USING (status = 'Published');

  CREATE POLICY "Privileged select legal versions" ON zoal_legal_document_versions
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
    );

  CREATE POLICY "Privileged insert legal versions" ON zoal_legal_document_versions
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
      AND status IN ('Draft', 'Published')
    );

  -- Existing Published rows cannot be updated through direct authenticated
  -- Supabase access. Draft rows may be updated, including Draft -> Published.
  CREATE POLICY "Privileged update legal drafts" ON zoal_legal_document_versions
    FOR UPDATE TO authenticated
    USING (
      status = 'Draft'
      AND EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
    )
    WITH CHECK (
      status IN ('Draft', 'Published')
      AND EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin', 'manager', 'staff', 'editor')
      )
    );

  -- Only Draft versions can be deleted directly, and only by Owner/Admin.
  CREATE POLICY "Privileged delete legal drafts" ON zoal_legal_document_versions
    FOR DELETE TO authenticated
    USING (
      status = 'Draft'
      AND EXISTS (
        SELECT 1 FROM zoal_users
        WHERE id = auth.uid()::text
          AND role IN ('owner', 'admin')
      )
    );
END $$;
