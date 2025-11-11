
-- Fix missing columns in advanced assessment tables
ALTER TABLE video_interviews ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE personality_assessments ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE skills_verifications ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE simulation_assessments ADD COLUMN IF NOT EXISTS overall_score INTEGER;

-- Add missing recruiter and candidate ID columns if they don't exist
ALTER TABLE video_interviews ADD COLUMN IF NOT EXISTS recruiter_id TEXT;
ALTER TABLE video_interviews ADD COLUMN IF NOT EXISTS candidate_id TEXT;
ALTER TABLE personality_assessments ADD COLUMN IF NOT EXISTS recruiter_id TEXT;
ALTER TABLE personality_assessments ADD COLUMN IF NOT EXISTS candidate_id TEXT;
ALTER TABLE skills_verifications ADD COLUMN IF NOT EXISTS recruiter_id TEXT;
ALTER TABLE skills_verifications ADD COLUMN IF NOT EXISTS candidate_id TEXT;
ALTER TABLE simulation_assessments ADD COLUMN IF NOT EXISTS recruiter_id TEXT;
ALTER TABLE simulation_assessments ADD COLUMN IF NOT EXISTS candidate_id TEXT;

-- Create interview invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_invitations (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  recruiter_id TEXT NOT NULL,
  job_posting_id INTEGER,
  interview_type TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT,
  difficulty TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  candidate_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
