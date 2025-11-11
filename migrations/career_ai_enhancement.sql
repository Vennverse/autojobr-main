-- Career AI Enhancement System Migration
-- Creates new tables for skill tracking, achievements, learning, mentoring, and community features

-- Skill Progress Logs - tracks skill development over time
CREATE TABLE IF NOT EXISTS "skill_progress_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"skill" varchar NOT NULL,
	"level" integer NOT NULL,
	"source" varchar NOT NULL,
	"recorded_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "skill_progress_logs_user_idx" ON "skill_progress_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "skill_progress_logs_skill_idx" ON "skill_progress_logs" ("skill");
CREATE INDEX IF NOT EXISTS "skill_progress_logs_recorded_idx" ON "skill_progress_logs" ("recorded_at");

-- Achievements Catalog - predefined achievements
CREATE TABLE IF NOT EXISTS "achievements_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar UNIQUE NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"icon" varchar NOT NULL,
	"points" integer DEFAULT 0,
	"category" varchar NOT NULL,
	"is_active" boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS "achievements_catalog_category_idx" ON "achievements_catalog" ("category");

-- User Achievements - tracks user's earned achievements
CREATE TABLE IF NOT EXISTS "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"achievement_id" integer NOT NULL REFERENCES "achievements_catalog"("id"),
	"earned_at" timestamp DEFAULT now(),
	UNIQUE("user_id", "achievement_id")
);

CREATE INDEX IF NOT EXISTS "user_achievements_user_idx" ON "user_achievements" ("user_id");
CREATE INDEX IF NOT EXISTS "user_achievements_earned_idx" ON "user_achievements" ("earned_at");

-- Learning Resources - curated learning materials
CREATE TABLE IF NOT EXISTS "learning_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"skill" varchar NOT NULL,
	"title" varchar NOT NULL,
	"url" varchar NOT NULL,
	"source" varchar NOT NULL,
	"cost" varchar DEFAULT 'free',
	"difficulty" varchar NOT NULL,
	"estimated_hours" integer,
	"rating" integer,
	"tags" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "learning_resources_skill_idx" ON "learning_resources" ("skill");
CREATE INDEX IF NOT EXISTS "learning_resources_difficulty_idx" ON "learning_resources" ("difficulty");
CREATE INDEX IF NOT EXISTS "learning_resources_cost_idx" ON "learning_resources" ("cost");

-- User Learning Plan - tracks user's learning journey
CREATE TABLE IF NOT EXISTS "user_learning_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"resource_id" integer NOT NULL REFERENCES "learning_resources"("id"),
	"status" varchar DEFAULT 'planned',
	"started_at" timestamp,
	"completed_at" timestamp,
	"progress" integer DEFAULT 0,
	"notes" text,
	"added_at" timestamp DEFAULT now(),
	UNIQUE("user_id", "resource_id")
);

CREATE INDEX IF NOT EXISTS "user_learning_plan_user_idx" ON "user_learning_plan" ("user_id");
CREATE INDEX IF NOT EXISTS "user_learning_plan_status_idx" ON "user_learning_plan" ("status");

-- Interview Preparations - AI-generated interview questions and practice
CREATE TABLE IF NOT EXISTS "interview_preps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"target_role" varchar NOT NULL,
	"company" varchar,
	"difficulty" varchar DEFAULT 'medium',
	"questions" jsonb NOT NULL,
	"practice_areas" text[],
	"times_used" integer DEFAULT 0,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "interview_preps_user_idx" ON "interview_preps" ("user_id");
CREATE INDEX IF NOT EXISTS "interview_preps_role_idx" ON "interview_preps" ("target_role");

-- Notifications - smart notification system
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"payload" jsonb,
	"is_read" boolean DEFAULT false,
	"priority" varchar DEFAULT 'medium',
	"scheduled_for" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" ("type");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" ("is_read");
CREATE INDEX IF NOT EXISTS "notifications_scheduled_idx" ON "notifications" ("scheduled_for");

-- Mentor Profiles - mentors offering guidance
CREATE TABLE IF NOT EXISTS "mentor_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"current_role" varchar NOT NULL,
	"company" varchar NOT NULL,
	"years_experience" integer NOT NULL,
	"expertise_skills" text[] NOT NULL,
	"availability" varchar NOT NULL,
	"session_type" varchar DEFAULT 'both',
	"max_mentees" integer DEFAULT 5,
	"bio" text NOT NULL,
	"linkedin_url" varchar,
	"hourly_rate" integer,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"rating" numeric(3, 2),
	"total_sessions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	UNIQUE("user_id")
);

CREATE INDEX IF NOT EXISTS "mentor_profiles_skills_idx" ON "mentor_profiles" ("expertise_skills");
CREATE INDEX IF NOT EXISTS "mentor_profiles_active_idx" ON "mentor_profiles" ("is_active");
CREATE INDEX IF NOT EXISTS "mentor_profiles_rating_idx" ON "mentor_profiles" ("rating");

-- Mentorship Requests - connection between mentors and mentees
CREATE TABLE IF NOT EXISTS "mentorship_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentee_id" varchar NOT NULL REFERENCES "users"("id"),
	"mentor_id" varchar NOT NULL REFERENCES "users"("id"),
	"message" text NOT NULL,
	"areas_of_focus" text[] NOT NULL,
	"preferred_schedule" varchar,
	"status" varchar DEFAULT 'pending',
	"session_scheduled" timestamp,
	"session_completed" timestamp,
	"mentee_rating" integer,
	"mentor_rating" integer,
	"session_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "mentorship_requests_mentee_idx" ON "mentorship_requests" ("mentee_id");
CREATE INDEX IF NOT EXISTS "mentorship_requests_mentor_idx" ON "mentorship_requests" ("mentor_id");
CREATE INDEX IF NOT EXISTS "mentorship_requests_status_idx" ON "mentorship_requests" ("status");

-- Shared Career Journeys - users can share their career progression stories
CREATE TABLE IF NOT EXISTS "shared_journeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"title" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"career_path" varchar NOT NULL,
	"years_span" integer NOT NULL,
	"tags" text[],
	"visibility" varchar DEFAULT 'public',
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "shared_journeys_user_idx" ON "shared_journeys" ("user_id");
CREATE INDEX IF NOT EXISTS "shared_journeys_visibility_idx" ON "shared_journeys" ("visibility");
CREATE INDEX IF NOT EXISTS "shared_journeys_approved_idx" ON "shared_journeys" ("is_approved");
CREATE INDEX IF NOT EXISTS "shared_journeys_featured_idx" ON "shared_journeys" ("is_featured");

-- Challenges - group challenges for career development
CREATE TABLE IF NOT EXISTS "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"target_count" integer,
	"target_unit" varchar,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"badge" varchar,
	"points" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"max_participants" integer,
	"current_participants" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "challenges_category_idx" ON "challenges" ("category");
CREATE INDEX IF NOT EXISTS "challenges_active_idx" ON "challenges" ("is_active");
CREATE INDEX IF NOT EXISTS "challenges_dates_idx" ON "challenges" ("start_at", "end_at");

-- Challenge Participants - tracks user participation in challenges
CREATE TABLE IF NOT EXISTS "challenge_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL REFERENCES "challenges"("id"),
	"user_id" varchar NOT NULL REFERENCES "users"("id"),
	"progress" jsonb DEFAULT '{}',
	"current_count" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"rank" integer,
	"points" integer DEFAULT 0,
	"joined_at" timestamp DEFAULT now(),
	UNIQUE("challenge_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "challenge_participants_challenge_idx" ON "challenge_participants" ("challenge_id");
CREATE INDEX IF NOT EXISTS "challenge_participants_user_idx" ON "challenge_participants" ("user_id");
CREATE INDEX IF NOT EXISTS "challenge_participants_completed_idx" ON "challenge_participants" ("is_completed");
CREATE INDEX IF NOT EXISTS "challenge_participants_rank_idx" ON "challenge_participants" ("rank");