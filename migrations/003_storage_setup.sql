-- =========================================================================
--             AL ZOAL LUXURY BOUTIQUE - STORAGE SYSTEM
-- =========================================================================
-- Version: 003
-- Description: Provision storage buckets and security policies.

-- Ensure storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('brands', 'brands', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('gallery', 'gallery', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('blogs', 'blogs', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', true, 20971520, NULL),
  ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Helper Function to Check Admin or Staff Role
CREATE OR REPLACE FUNCTION storage.is_zoal_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.zoal_users
    WHERE id = auth.uid()::text AND role IN ('admin', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Clean up old storage policies
DROP POLICY IF EXISTS "Allow Public Access to Public Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Staff full access to storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own invoices" ON storage.objects;

-- 5. Create Storage Policies
CREATE POLICY "Allow Public Access to Public Buckets" ON storage.objects 
  FOR SELECT USING (bucket_id IN ('products', 'categories', 'brands', 'avatars', 'gallery', 'banners', 'blogs', 'documents'));

CREATE POLICY "Admin/Staff full access to storage" ON storage.objects 
  FOR ALL USING (storage.is_zoal_admin()) WITH CHECK (storage.is_zoal_admin());

CREATE POLICY "Users can manage their own avatars" ON storage.objects 
  FOR ALL USING (
    bucket_id = 'avatars' AND 
    (substring(name from '^([^/]+)') = auth.uid()::text)
  ) WITH CHECK (
    bucket_id = 'avatars' AND 
    (substring(name from '^([^/]+)') = auth.uid()::text)
  );

CREATE POLICY "Users can read their own invoices" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'invoices' AND 
    (substring(name from '^([^/]+)') = auth.uid()::text OR storage.is_zoal_admin())
  );

CREATE POLICY "Users can manage their own invoices" ON storage.objects 
  FOR ALL USING (
    bucket_id = 'invoices' AND 
    (substring(name from '^([^/]+)') = auth.uid()::text OR storage.is_zoal_admin())
  ) WITH CHECK (
    bucket_id = 'invoices' AND 
    (substring(name from '^([^/]+)') = auth.uid()::text OR storage.is_zoal_admin())
  );
