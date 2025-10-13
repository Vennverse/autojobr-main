-- Add missing CRM tables

-- CRM Companies table
CREATE TABLE IF NOT EXISTS "crm_companies" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR NOT NULL,
  "domain" VARCHAR,
  "website" VARCHAR,
  "industry" VARCHAR,
  "size" VARCHAR,
  "revenue" VARCHAR,
  "phone" VARCHAR,
  "address" TEXT,
  "city" VARCHAR,
  "state" VARCHAR,
  "country" VARCHAR,
  "zip_code" VARCHAR,
  "linkedin_url" VARCHAR,
  "twitter_url" VARCHAR,
  "facebook_url" VARCHAR,
  "description" TEXT,
  "founded" VARCHAR,
  "employee_count" INTEGER,
  "location" VARCHAR,
  "logo_url" VARCHAR,
  "status" VARCHAR DEFAULT 'active',
  "company_type" VARCHAR,
  "tags" TEXT[],
  "custom_fields" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_companies_user_idx" ON "crm_companies"("user_id");
CREATE INDEX "crm_companies_name_idx" ON "crm_companies"("name");

-- CRM Deals table
CREATE TABLE IF NOT EXISTS "crm_deals" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "deal_name" VARCHAR NOT NULL,
  "deal_value" NUMERIC(10, 2),
  "currency" VARCHAR DEFAULT 'USD',
  "company_id" INTEGER REFERENCES "crm_companies"("id"),
  "contact_id" INTEGER REFERENCES "crm_contacts"("id"),
  "pipeline_type" VARCHAR DEFAULT 'sales',
  "stage" VARCHAR NOT NULL,
  "probability" INTEGER DEFAULT 50,
  "expected_close_date" TIMESTAMP,
  "actual_close_date" TIMESTAMP,
  "deal_type" VARCHAR,
  "deal_source" VARCHAR,
  "lost_reason" VARCHAR,
  "owner_id" VARCHAR,
  "notes" TEXT,
  "custom_fields" JSONB,
  "tags" TEXT[],
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_deals_user_idx" ON "crm_deals"("user_id");
CREATE INDEX "crm_deals_company_idx" ON "crm_deals"("company_id");
CREATE INDEX "crm_deals_contact_idx" ON "crm_deals"("contact_id");
CREATE INDEX "crm_deals_stage_idx" ON "crm_deals"("stage");

-- CRM Email Templates table
CREATE TABLE IF NOT EXISTS "crm_email_templates" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR NOT NULL,
  "subject" VARCHAR NOT NULL,
  "body" TEXT NOT NULL,
  "category" VARCHAR,
  "language" VARCHAR DEFAULT 'en',
  "has_personalization" BOOLEAN DEFAULT FALSE,
  "variables" TEXT[],
  "use_count" INTEGER DEFAULT 0,
  "last_used_at" TIMESTAMP,
  "tags" TEXT[],
  "is_active" BOOLEAN DEFAULT TRUE,
  "is_shared" BOOLEAN DEFAULT FALSE,
  "usage_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_email_templates_user_idx" ON "crm_email_templates"("user_id");
CREATE INDEX "crm_email_templates_category_idx" ON "crm_email_templates"("category");

-- CRM Email Campaigns table
CREATE TABLE IF NOT EXISTS "crm_email_campaigns" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "template_id" INTEGER REFERENCES "crm_email_templates"("id"),
  "status" VARCHAR DEFAULT 'draft',
  "recipients_count" INTEGER DEFAULT 0,
  "sent_count" INTEGER DEFAULT 0,
  "opened_count" INTEGER DEFAULT 0,
  "clicked_count" INTEGER DEFAULT 0,
  "scheduled_at" TIMESTAMP,
  "sent_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_email_campaigns_user_idx" ON "crm_email_campaigns"("user_id");
CREATE INDEX "crm_email_campaigns_status_idx" ON "crm_email_campaigns"("status");

-- CRM Email Sequences table
CREATE TABLE IF NOT EXISTS "crm_email_sequences" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT TRUE,
  "total_enrolled" INTEGER DEFAULT 0,
  "total_completed" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_email_sequences_user_idx" ON "crm_email_sequences"("user_id");
CREATE INDEX "crm_email_sequences_active_idx" ON "crm_email_sequences"("is_active");

-- CRM Sequence Steps table
CREATE TABLE IF NOT EXISTS "crm_sequence_steps" (
  "id" SERIAL PRIMARY KEY,
  "sequence_id" INTEGER NOT NULL REFERENCES "crm_email_sequences"("id") ON DELETE CASCADE,
  "step_number" INTEGER NOT NULL,
  "step_type" VARCHAR DEFAULT 'email',
  "subject" VARCHAR,
  "body" TEXT,
  "task_title" VARCHAR,
  "task_description" TEXT,
  "delay_days" INTEGER DEFAULT 0,
  "delay_hours" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_sequence_steps_sequence_idx" ON "crm_sequence_steps"("sequence_id");
CREATE INDEX "crm_sequence_steps_number_idx" ON "crm_sequence_steps"("step_number");

-- CRM Sequence Enrollments table
CREATE TABLE IF NOT EXISTS "crm_sequence_enrollments" (
  "id" SERIAL PRIMARY KEY,
  "sequence_id" INTEGER NOT NULL REFERENCES "crm_email_sequences"("id"),
  "contact_id" INTEGER NOT NULL REFERENCES "crm_contacts"("id"),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "current_step" INTEGER DEFAULT 1,
  "status" VARCHAR DEFAULT 'active',
  "enrolled_at" TIMESTAMP DEFAULT NOW(),
  "completed_at" TIMESTAMP,
  "next_action_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_sequence_enrollments_sequence_idx" ON "crm_sequence_enrollments"("sequence_id");
CREATE INDEX "crm_sequence_enrollments_contact_idx" ON "crm_sequence_enrollments"("contact_id");
CREATE INDEX "crm_sequence_enrollments_status_idx" ON "crm_sequence_enrollments"("status");
CREATE INDEX "crm_sequence_enrollments_next_action_idx" ON "crm_sequence_enrollments"("next_action_at");

-- CRM Workflows table
CREATE TABLE IF NOT EXISTS "crm_workflows" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "trigger_type" VARCHAR NOT NULL,
  "trigger_conditions" JSONB,
  "actions" JSONB,
  "is_active" BOOLEAN DEFAULT FALSE,
  "total_triggers" INTEGER DEFAULT 0,
  "total_actions" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_workflows_user_idx" ON "crm_workflows"("user_id");
CREATE INDEX "crm_workflows_active_idx" ON "crm_workflows"("is_active");
CREATE INDEX "crm_workflows_trigger_idx" ON "crm_workflows"("trigger_type");

-- CRM Meetings table
CREATE TABLE IF NOT EXISTS "crm_meetings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "title" VARCHAR NOT NULL,
  "description" TEXT,
  "meeting_type" VARCHAR,
  "location" VARCHAR,
  "meeting_link" VARCHAR,
  "start_time" TIMESTAMP NOT NULL,
  "end_time" TIMESTAMP NOT NULL,
  "duration" INTEGER,
  "attendee_ids" TEXT[],
  "contact_id" INTEGER REFERENCES "crm_contacts"("id"),
  "company_id" INTEGER REFERENCES "crm_companies"("id"),
  "deal_id" INTEGER REFERENCES "crm_deals"("id"),
  "status" VARCHAR DEFAULT 'scheduled',
  "notes" TEXT,
  "outcome" VARCHAR,
  "recording_url" VARCHAR,
  "reminder_sent" BOOLEAN DEFAULT FALSE,
  "reminder_minutes_before" INTEGER DEFAULT 30,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_meetings_user_idx" ON "crm_meetings"("user_id");
CREATE INDEX "crm_meetings_contact_idx" ON "crm_meetings"("contact_id");
CREATE INDEX "crm_meetings_company_idx" ON "crm_meetings"("company_id");
CREATE INDEX "crm_meetings_start_time_idx" ON "crm_meetings"("start_time");

-- CRM Documents table
CREATE TABLE IF NOT EXISTS "crm_documents" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "file_url" VARCHAR NOT NULL,
  "file_type" VARCHAR,
  "file_size" INTEGER,
  "related_type" VARCHAR,
  "related_id" INTEGER,
  "uploaded_by" VARCHAR,
  "tags" TEXT[],
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_documents_user_idx" ON "crm_documents"("user_id");
CREATE INDEX "crm_documents_related_idx" ON "crm_documents"("related_type", "related_id");

-- CRM Activities table
CREATE TABLE IF NOT EXISTS "crm_activities" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "activity_type" VARCHAR NOT NULL,
  "title" VARCHAR NOT NULL,
  "description" TEXT,
  "contact_id" INTEGER REFERENCES "crm_contacts"("id"),
  "company_id" INTEGER REFERENCES "crm_companies"("id"),
  "deal_id" INTEGER REFERENCES "crm_deals"("id"),
  "metadata" JSONB,
  "status" VARCHAR DEFAULT 'completed',
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_activities_user_idx" ON "crm_activities"("user_id");
CREATE INDEX "crm_activities_type_idx" ON "crm_activities"("activity_type");
CREATE INDEX "crm_activities_contact_idx" ON "crm_activities"("contact_id");
CREATE INDEX "crm_activities_company_idx" ON "crm_activities"("company_id");
CREATE INDEX "crm_activities_deal_idx" ON "crm_activities"("deal_id");
CREATE INDEX "crm_activities_created_idx" ON "crm_activities"("created_at");

-- CRM Lead Scores table
CREATE TABLE IF NOT EXISTS "crm_lead_scores" (
  "id" SERIAL PRIMARY KEY,
  "contact_id" INTEGER NOT NULL REFERENCES "crm_contacts"("id") UNIQUE,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "total_score" INTEGER DEFAULT 0,
  "engagement_score" INTEGER DEFAULT 0,
  "demographic_score" INTEGER DEFAULT 0,
  "behavior_score" INTEGER DEFAULT 0,
  "grade" VARCHAR,
  "scoring_factors" JSONB,
  "last_activity_date" TIMESTAMP,
  "last_email_open" TIMESTAMP,
  "last_email_click" TIMESTAMP,
  "last_meeting" TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_lead_scores_contact_idx" ON "crm_lead_scores"("contact_id");
CREATE INDEX "crm_lead_scores_user_idx" ON "crm_lead_scores"("user_id");
CREATE INDEX "crm_lead_scores_total_idx" ON "crm_lead_scores"("total_score");
CREATE INDEX "crm_lead_scores_grade_idx" ON "crm_lead_scores"("grade");