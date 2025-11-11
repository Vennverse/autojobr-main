
-- Fix interview invitations table structure
DROP TABLE IF EXISTS interview_invitations CASCADE;

CREATE TABLE interview_invitations (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  recruiter_id TEXT NOT NULL,
  job_posting_id INTEGER,
  interview_type TEXT NOT NULL,
  interview_config TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT,
  difficulty TEXT NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  candidate_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX interview_invitations_token_idx ON interview_invitations(token);
CREATE INDEX interview_invitations_recruiter_idx ON interview_invitations(recruiter_id);
CREATE INDEX interview_invitations_job_idx ON interview_invitations(job_posting_id);

-- Add foreign key constraints
ALTER TABLE interview_invitations 
ADD CONSTRAINT fk_interview_invitations_recruiter 
FOREIGN KEY (recruiter_id) REFERENCES users(id);

ALTER TABLE interview_invitations 
ADD CONSTRAINT fk_interview_invitations_job_posting 
FOREIGN KEY (job_posting_id) REFERENCES job_postings(id);
