# Manual Storage Setup for Avatar Uploads

## Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Fill in the details:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Check this box
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
5. Click **"Create bucket"**

## Step 2: Configure Storage Policies

1. In the **Storage** section, click on the **"avatars"** bucket
2. Go to the **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"Create a policy from scratch"**
5. Add these policies one by one:

### Policy 1: Allow authenticated users to upload
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Using expression**: `bucket_id = 'avatars'`

### Policy 2: Allow public to view
- **Policy name**: `Allow public view`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Using expression**: `bucket_id = 'avatars'`

### Policy 3: Allow users to update their own files
- **Policy name**: `Allow user updates`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Using expression**: `bucket_id = 'avatars'`

### Policy 4: Allow users to delete their own files
- **Policy name**: `Allow user deletes`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Using expression**: `bucket_id = 'avatars'`

## Step 3: Test the Setup

1. Go to your app's profile page
2. Use the **"Test Storage"** button to verify everything works
3. Check the browser console for detailed logs
4. Try uploading an avatar image

## Troubleshooting

### If you get "bucket not found" error:
- Make sure the bucket name is exactly `avatars` (lowercase)
- Check that the bucket is created in the correct project

### If you get "permission denied" error:
- Make sure you're logged in to the app
- Check that the storage policies are correctly configured
- Try the alternative simple policy in the SQL file

### If you get "RLS policy" error:
- Make sure RLS is enabled on the storage.objects table
- Check that the policies are active and not conflicting

### Alternative: Use SQL Script
If the manual setup doesn't work, you can run the SQL script:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `simple-storage-setup.sql`
3. Click **"Run"**

## Verification

After setup, you should see:
- ✅ Bucket "avatars" exists in Storage
- ✅ Policies are listed in the bucket's Policies tab
- ✅ "Test Storage" button works without errors
- ✅ Avatar upload works in the profile form

## Common Issues

1. **Bucket name mismatch**: Ensure the bucket is named exactly `avatars`
2. **Missing policies**: All 4 policies must be created
3. **Authentication issues**: Make sure the user is properly authenticated
4. **File size limits**: Check that the file is under 5MB
5. **File type restrictions**: Only image files are allowed 