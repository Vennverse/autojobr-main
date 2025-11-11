
-- Add hiring_team and follow_up_contacts columns to job_applications table

ALTER TABLE "job_applications" 
ADD COLUMN IF NOT EXISTS "hiring_team" jsonb,
ADD COLUMN IF NOT EXISTS "follow_up_contacts" jsonb;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_job_applications_hiring_team" ON "job_applications" USING gin ("hiring_team");
CREATE INDEX IF NOT EXISTS "idx_job_applications_follow_up_contacts" ON "job_applications" USING gin ("follow_up_contacts");
