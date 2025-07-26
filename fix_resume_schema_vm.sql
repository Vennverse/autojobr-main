-- SQL script to fix resume upload schema issue on VM
-- Run this on your VM database to add the missing file_data column

-- Add the file_data column to store base64 encoded files
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_data TEXT;

-- Make file_path optional (in case it was required before)
ALTER TABLE resumes ALTER COLUMN file_path DROP NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resumes' 
AND column_name IN ('file_path', 'file_data')
ORDER BY column_name;