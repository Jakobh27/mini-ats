# Supabase Storage Setup Guide

## Creating the CVs Bucket

This guide explains how to set up the Supabase Storage bucket for CV file uploads.

### Step 1: Create the Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**
5. Name it `cvs`
6. Leave visibility as **Public** (files will be publicly readable)
7. Click **Create bucket**

### Step 2: Configure Bucket Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies for the bucket.

#### Create Upload Policy (Authenticated Users Only)

1. Go to **Storage** → **Policies**
2. Select the `cvs` bucket
3. Click **New policy** → **For full customization**
4. Configure as follows:
   - **Policy name**: `Allow authenticated users to upload their own CVs`
   - **Operation**: SELECT
   - **For**: Authenticated users
   - **Using expression**: `bucket_id = 'cvs'`
   - Click **Save**

5. Create another policy for uploads:
   - Click **New policy** → **For full customization**
   - **Policy name**: `Allow authenticated users to upload CVs`
   - **Operation**: INSERT
   - **For**: Authenticated users
   - **With check**: `auth.uid()::text = (storage.foldername(name))[1]`
   - Click **Save**

#### Alternative: Using SQL

If you prefer to set policies via SQL, go to **SQL Editor** and run:

```sql
-- Allow authenticated users to read CVs
CREATE POLICY "Allow public read access to CVs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cvs');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Allow authenticated users to upload CVs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cvs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own CVs
CREATE POLICY "Allow users to delete their own CVs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cvs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: File Upload Structure

CVs are stored with the following structure:

```
cvs/
├── user-id-1/
│   ├── user-id-1_1234567890_abc123.pdf
│   └── user-id-1_1234567891_def456.pdf
├── user-id-2/
│   └── user-id-2_1234567892_ghi789.pdf
```

- **Folder**: User's Supabase Auth ID (ensures users can only upload to their own folder)
- **Filename format**: `{userId}_{timestamp}_{randomString}.pdf`
- This prevents filename collisions and makes deletion of old CVs easy

### Step 4: Verify Setup

After setting up the bucket and policies:

1. Try adding a candidate with a CV file from the **Add candidate** form
2. The file should upload successfully
3. You should see the CV file appear in your Storage bucket under `cvs/{userId}/`

### File Size and Type Validation

- **Max file size**: 10 MB (enforced client-side in forms)
- **File types**: PDF only (enforced client-side)
- Consider adding server-side validation via Edge Functions for production

### Troubleshooting

**Issue**: "Permission denied" when uploading
- Check that the bucket name is exactly `cvs`
- Verify RLS policies are enabled
- Ensure the upload policy references the correct folder structure

**Issue**: Files uploaded but can't be accessed
- Verify bucket is set to **Public** visibility
- Check that `resume_url` is being saved in the database

**Issue**: Old CVs not being replaced
- When updating a candidate with a new CV, a new file is created
- The old `resume_url` is overwritten in the database
- Old files in storage remain (consider adding cleanup)

### Production Recommendations

1. **Add virus scanning**: Use an Edge Function to scan uploaded files
2. **Add rate limiting**: Prevent abuse of upload endpoint
3. **Archive old CVs**: Create a cleanup policy to remove old files after 30 days
4. **Use private bucket**: Change bucket to private and serve via signed URLs for security

## Next Steps

Now that storage is configured:

1. Run the SQL migration: `sql/schema-updates.sql` to add email, phone, resume_url columns
2. Start using the app to add candidates with CV uploads
3. Navigate to candidate detail pages to view and download CVs
