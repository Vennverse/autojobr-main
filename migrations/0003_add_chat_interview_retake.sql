
-- Add retake payment columns to virtual_interviews table
ALTER TABLE virtual_interviews 
ADD COLUMN IF NOT EXISTS retake_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retake_payment_id TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_virtual_interviews_retake ON virtual_interviews(retake_allowed);
