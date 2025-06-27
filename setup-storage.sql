-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create simplified storage policies for avatars bucket
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to update avatars" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to delete avatars" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow public to view avatars" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars'); 