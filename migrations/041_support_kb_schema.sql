-- =========================================================================
--     041_support_kb_schema.sql - SUPPORT KNOWLEDGE BASE SCHEMA
-- =========================================================================

CREATE TABLE IF NOT EXISTS zoal_support_kb (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Internal')),
  author TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE zoal_support_kb ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if any
DROP POLICY IF EXISTS "Support KB select policy" ON zoal_support_kb;
DROP POLICY IF EXISTS "Support KB insert policy" ON zoal_support_kb;
DROP POLICY IF EXISTS "Support KB update policy" ON zoal_support_kb;
DROP POLICY IF EXISTS "Support KB delete policy" ON zoal_support_kb;

-- SELECT POLICY: Authorized staff can view all articles; public/customers can view published articles.
CREATE POLICY "Support KB select policy" ON zoal_support_kb
  FOR SELECT
  USING (
    public.is_support_staff_role()
    OR status = 'Published'
  );

-- INSERT POLICY: Only authorized staff can create KB articles.
CREATE POLICY "Support KB insert policy" ON zoal_support_kb
  FOR INSERT
  WITH CHECK (
    public.is_support_staff_role()
  );

-- UPDATE POLICY: Only authorized staff can update KB articles.
CREATE POLICY "Support KB update policy" ON zoal_support_kb
  FOR UPDATE
  USING (
    public.is_support_staff_role()
  )
  WITH CHECK (
    public.is_support_staff_role()
  );

-- DELETE POLICY: Only authorized staff can delete KB articles.
CREATE POLICY "Support KB delete policy" ON zoal_support_kb
  FOR DELETE
  USING (
    public.is_support_staff_role()
  );
