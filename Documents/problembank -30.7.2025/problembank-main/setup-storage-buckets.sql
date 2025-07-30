-- Setup Storage Buckets for Media Uploads
-- Run this in Supabase SQL Editor to create the necessary storage buckets and policies

-- Note: Storage buckets cannot be created via SQL in Supabase
-- You need to create them via the Supabase Dashboard, but here are the policies

-- After creating the 'media' bucket in Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name it "media"
-- 4. Make it PUBLIC (toggle on)
-- 5. Then run these policies:

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow users to update own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow public to view media files
CREATE POLICY "Allow public to view media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');