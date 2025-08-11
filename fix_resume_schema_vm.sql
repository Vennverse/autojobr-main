-- Fix resume upload constraint issues on VM
-- Run these commands directly in your VM PostgreSQL database

-- Connect to database first:
-- psql "postgresql://autojobr_user:autojobr123@40.160.50.128:5432/autojobr"

-- Check current constraints on resumes table
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'resumes'::regclass;

-- Add file_data column if it doesn't exist
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT;

-- Make file_path column nullable (remove NOT NULL constraint)
ALTER TABLE resumes ALTER COLUMN file_path DROP NOT NULL;

-- Check if there are any other constraints causing issues
\d resumes

-- Test insert to see what's failing
-- INSERT INTO resumes (user_id, name, file_name, file_data, resume_text, is_active, ats_score, analysis_data, file_size, mime_type, created_at, updated_at) 
-- VALUES ('test', 'Test Resume', 'test.pdf', 'test_data', 'test text', false, 75, '{}', 1024, 'application/pdf', NOW(), NOW());

-- If there are foreign key constraint issues, check users table
SELECT id FROM users LIMIT 5;

-- Show final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'resumes' 
ORDER BY ordinal_position;