-- Add new columns to candidates table for enhanced candidate management
-- Run this migration in your Supabase SQL Editor

-- Add email column
ALTER TABLE candidates ADD COLUMN email TEXT;

-- Add phone column
ALTER TABLE candidates ADD COLUMN phone TEXT;

-- Add resume_url column (stores public URL from Supabase Storage)
ALTER TABLE candidates ADD COLUMN resume_url TEXT;

-- Make email and phone required (set NOT NULL after migrating existing data if needed)
-- ALTER TABLE candidates ALTER COLUMN email SET NOT NULL;
-- ALTER TABLE candidates ALTER COLUMN phone SET NOT NULL;

-- Verify the new columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name='candidates' AND column_name IN ('email', 'phone', 'resume_url');
