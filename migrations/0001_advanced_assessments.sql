
-- Migration for Advanced Assessment System
-- Run this to add the new tables to your database

CREATE TABLE IF NOT EXISTS "video_interviews" (
  "id" SERIAL PRIMARY KEY,
  "candidate_id" TEXT NOT NULL,
  "recruiter_id" TEXT NOT NULL,
  "job_id" INTEGER,
  "questions" TEXT NOT NULL,
  "total_time_limit" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "session_id" TEXT,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "expiry_date" TIMESTAMP NOT NULL,
  "score" INTEGER,
  "feedback" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "video_responses" (
  "id" SERIAL PRIMARY KEY,
  "interview_id" INTEGER NOT NULL REFERENCES "video_interviews"("id"),
  "question_id" TEXT NOT NULL,
  "video_path" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "device_info" TEXT,
  "analysis" TEXT,
  "score" INTEGER,
  "processed_at" TIMESTAMP,
  "uploaded_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "simulation_assessments" (
  "id" SERIAL PRIMARY KEY,
  "candidate_id" TEXT NOT NULL,
  "recruiter_id" TEXT NOT NULL,
  "job_id" INTEGER,
  "scenario_id" TEXT NOT NULL,
  "scenario" TEXT NOT NULL,
  "session_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "result" TEXT,
  "score" INTEGER,
  "expiry_date" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "personality_assessments" (
  "id" SERIAL PRIMARY KEY,
  "candidate_id" TEXT NOT NULL,
  "recruiter_id" TEXT NOT NULL,
  "job_id" INTEGER,
  "assessment_type" TEXT NOT NULL,
  "questions" TEXT NOT NULL,
  "responses" TEXT,
  "results" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "time_limit" INTEGER,
  "job_role" TEXT,
  "industry" TEXT,
  "completed_at" TIMESTAMP,
  "expiry_date" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "skills_verifications" (
  "id" SERIAL PRIMARY KEY,
  "candidate_id" TEXT NOT NULL,
  "recruiter_id" TEXT NOT NULL,
  "job_id" INTEGER,
  "project_template_id" TEXT NOT NULL,
  "project_template" TEXT NOT NULL,
  "submissions" TEXT,
  "results" TEXT,
  "status" TEXT NOT NULL DEFAULT 'assigned',
  "time_limit" INTEGER,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "score" INTEGER,
  "expiry_date" TIMESTAMP NOT NULL,
  "customizations" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_video_interviews_candidate" ON "video_interviews"("candidate_id");
CREATE INDEX IF NOT EXISTS "idx_video_interviews_recruiter" ON "video_interviews"("recruiter_id");
CREATE INDEX IF NOT EXISTS "idx_video_responses_interview" ON "video_responses"("interview_id");
CREATE INDEX IF NOT EXISTS "idx_simulation_assessments_candidate" ON "simulation_assessments"("candidate_id");
CREATE INDEX IF NOT EXISTS "idx_personality_assessments_candidate" ON "personality_assessments"("candidate_id");
CREATE INDEX IF NOT EXISTS "idx_skills_verifications_candidate" ON "skills_verifications"("candidate_id");
