-- =========================================================================
-- ZOAL LEGAL CENTER - PUBLISHED VERSION IMMUTABILITY
-- Version: 047
-- Purpose: Defense-in-depth protection for legally published versions.
-- =========================================================================

-- Published legal text is historical compliance evidence and must never be
-- edited or deleted through any normal database path, including service-role
-- paths that bypass RLS. Revisions must be represented by a new version.
CREATE OR REPLACE FUNCTION prevent_published_legal_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'Published' THEN
      RAISE EXCEPTION 'Published legal versions are immutable and cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'Published' THEN
    RAISE EXCEPTION 'Published legal versions are immutable and cannot be updated';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_published_legal_version_mutation
  ON zoal_legal_document_versions;

CREATE TRIGGER trg_prevent_published_legal_version_mutation
BEFORE UPDATE OR DELETE
ON zoal_legal_document_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_published_legal_version_mutation();
