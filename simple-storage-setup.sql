-- Simple Storage Setup for YouTube Clone
-- Run this in Supabase SQL Editor

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create simple storage policies
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow public to view
CREATE POLICY "Allow public view" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own files
CREATE POLICY "Allow user updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "Allow user deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 3. Alternative: Simple policy that allows all authenticated users to upload
-- Uncomment the lines below if the above policies don't work

-- DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
-- FOR ALL USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- CREATE POLICY "Public can view avatars" ON storage.objects
-- FOR SELECT USING (bucket_id = 'avatars'); 