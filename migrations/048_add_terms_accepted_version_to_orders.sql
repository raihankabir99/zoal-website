-- =========================================================================
--     AL ZOAL RAQI ENTERPRISE eCOMMERCE - LEGAL CONSENT TRACKING & SEEDING
-- =========================================================================
-- Version: 048
-- Description: Adds terms_accepted_version_id column to zoal_orders table and
--              seeds baseline published Terms and Privacy policy documents.
-- =========================================================================

-- 1. Add terms_accepted_version_id column to zoal_orders
ALTER TABLE zoal_orders
ADD COLUMN IF NOT EXISTS terms_accepted_version_id UUID REFERENCES zoal_legal_document_versions(id) ON DELETE SET NULL;

-- 2. Seed baseline Published Legal Documents if missing
DO $$
DECLARE
  terms_doc_id UUID;
  terms_ver_id UUID;
  privacy_doc_id UUID;
  privacy_ver_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM zoal_legal_documents WHERE slug = 'terms' OR slug = 'terms-and-conditions') THEN
    INSERT INTO zoal_legal_documents (slug, title)
    VALUES ('terms', 'Boutique Terms & Conditions')
    RETURNING id INTO terms_doc_id;

    INSERT INTO zoal_legal_document_versions (document_id, content, version_number, status)
    VALUES (
      terms_doc_id,
      'Welcome to ZOAL. By accessing, browsing, registering, or making a transaction on the ZOAL boutique platform, you unconditionally agree to be bound by these comprehensive Terms & Conditions. These terms establish a legally binding agreement between you, as our customer, and ZOAL. Eligibility: The ZOAL platform is strictly reserved for individuals who are legally capable of entering into binding contracts under the laws of Saudi Arabia. Customer Accounts: You agree to maintain absolute confidentiality of your account credentials and accept full responsibility for all transactions performed under your account.',
      1,
      'Published'
    )
    RETURNING id INTO terms_ver_id;

    UPDATE zoal_legal_documents SET current_version_id = terms_ver_id WHERE id = terms_doc_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM zoal_legal_documents WHERE slug = 'privacy' OR slug = 'privacy-policy') THEN
    INSERT INTO zoal_legal_documents (slug, title)
    VALUES ('privacy', 'Digital Privacy Policy')
    RETURNING id INTO privacy_doc_id;

    INSERT INTO zoal_legal_document_versions (document_id, content, version_number, status)
    VALUES (
      privacy_doc_id,
      'ZOAL is dedicated to respecting, honoring, and protecting your personal privacy. We collect personal data including name, email, phone number, and delivery addresses strictly to process your orders and personalize your luxury experience. All sensitive payment transactions are encrypted using enterprise-grade SSL/TLS protocols under Saudi Arabia regulatory standards. You have the right to inspect, update, or request deletion of eligible personal information at any time.',
      1,
      'Published'
    )
    RETURNING id INTO privacy_ver_id;

    UPDATE zoal_legal_documents SET current_version_id = privacy_ver_id WHERE id = privacy_doc_id;
  END IF;
END $$;