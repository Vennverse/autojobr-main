
-- ACE Features Migration: Predictive Success Intelligence & Viral Extension Network Effects
-- Run this to add the new tables for ACE features

-- Job Intelligence Table - stores crowd-sourced job insights
CREATE TABLE IF NOT EXISTS "job_intelligence" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "job_url" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "salary_info" TEXT,
  "interview_experience" TEXT,
  "company_tips" TEXT,
  "application_tips" TEXT,
  "helpfulness_score" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Viral Referrals Table - tracks referral opportunities and rewards
CREATE TABLE IF NOT EXISTS "viral_referrals" (
  "id" SERIAL PRIMARY KEY,
  "referrer_id" TEXT NOT NULL,
  "job_url" TEXT NOT NULL,
  "referral_code" TEXT UNIQUE NOT NULL,
  "referrals_count" INTEGER DEFAULT 0,
  "successful_referrals" INTEGER DEFAULT 0,
  "points_earned" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "expires_at" TIMESTAMP
);

-- Success Predictions Table - stores AI predictions for learning
CREATE TABLE IF NOT EXISTS "success_predictions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "job_id" INTEGER,
  "job_url" TEXT,
  "predicted_probability" INTEGER NOT NULL,
  "confidence_level" TEXT NOT NULL,
  "factors" JSONB,
  "actual_outcome" TEXT,
  "prediction_accuracy" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "outcome_recorded_at" TIMESTAMP
);

-- Viral User Stats Table - tracks user viral activity and rewards
CREATE TABLE IF NOT EXISTS "viral_user_stats" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT UNIQUE NOT NULL,
  "total_points" INTEGER DEFAULT 0,
  "referral_count" INTEGER DEFAULT 0,
  "intel_contributions" INTEGER DEFAULT 0,
  "helpfulness_score" NUMERIC(3,2) DEFAULT 0,
  "viral_rank" INTEGER DEFAULT 0,
  "badges_earned" TEXT[] DEFAULT '{}',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Extension Application Tracking - tracks applications made through extension
CREATE TABLE IF NOT EXISTS "extension_applications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "job_url" TEXT NOT NULL,
  "company" TEXT,
  "application_method" TEXT DEFAULT 'auto_fill',
  "time_to_complete" INTEGER,
  "fields_auto_filled" INTEGER,
  "success_boost_type" TEXT,
  "viral_data" JSONB,
  "applied_at" TIMESTAMP DEFAULT NOW()
);

-- Job Application Stats - aggregated stats per job URL
CREATE TABLE IF NOT EXISTS "job_application_stats" (
  "id" SERIAL PRIMARY KEY,
  "job_url" TEXT UNIQUE NOT NULL,
  "company" TEXT,
  "total_applicants" INTEGER DEFAULT 0,
  "autojobr_applicants" INTEGER DEFAULT 0,
  "success_rate" NUMERIC(5,2) DEFAULT 0,
  "average_salary" INTEGER,
  "competition_level" TEXT DEFAULT 'medium',
  "last_updated" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_job_intelligence_user" ON "job_intelligence"("user_id");
CREATE INDEX IF NOT EXISTS "idx_job_intelligence_url" ON "job_intelligence"("job_url");
CREATE INDEX IF NOT EXISTS "idx_viral_referrals_referrer" ON "viral_referrals"("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_viral_referrals_code" ON "viral_referrals"("referral_code");
CREATE INDEX IF NOT EXISTS "idx_success_predictions_user" ON "success_predictions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_viral_user_stats_user" ON "viral_user_stats"("user_id");
CREATE INDEX IF NOT EXISTS "idx_viral_user_stats_rank" ON "viral_user_stats"("viral_rank");
CREATE INDEX IF NOT EXISTS "idx_extension_applications_user" ON "extension_applications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_extension_applications_url" ON "extension_applications"("job_url");
CREATE INDEX IF NOT EXISTS "idx_job_application_stats_url" ON "job_application_stats"("job_url");
