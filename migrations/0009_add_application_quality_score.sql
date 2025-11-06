-- Add application_quality_score column to job_applications table
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "application_quality_score" integer;

-- Add resume_tailored column for tracking if resume was customized
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "resume_tailored" boolean DEFAULT false;

-- Add cover_letter_created column for tracking cover letter creation
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "cover_letter_created" boolean DEFAULT false;

-- Add linkedin_connections_made column for tracking networking efforts
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "linkedin_connections_made" boolean DEFAULT false;

-- Add response_received column for tracking employer responses
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "response_received" boolean DEFAULT false;

-- Add last_contacted_at column for tracking follow-up timing
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "last_contacted_at" timestamp;