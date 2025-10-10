
-- CRM Contact Management System Migration

-- Contacts table
CREATE TABLE IF NOT EXISTS "crm_contacts" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR NOT NULL,
  "email" VARCHAR,
  "phone" VARCHAR,
  "company" VARCHAR,
  "job_title" VARCHAR,
  "linkedin_url" VARCHAR,
  "contact_type" VARCHAR NOT NULL,
  "tags" TEXT[],
  "relationship" VARCHAR,
  "source" VARCHAR,
  "last_contact_date" TIMESTAMP,
  "next_touch_date" TIMESTAMP,
  "touch_frequency" VARCHAR DEFAULT 'monthly',
  "notes" TEXT,
  "custom_fields" JSONB,
  "status" VARCHAR DEFAULT 'active',
  "priority" VARCHAR DEFAULT 'medium',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "crm_contacts_user_idx" ON "crm_contacts"("user_id");
CREATE INDEX "crm_contacts_type_idx" ON "crm_contacts"("contact_type");
CREATE INDEX "crm_contacts_next_touch_idx" ON "crm_contacts"("next_touch_date");
CREATE INDEX "crm_contacts_company_idx" ON "crm_contacts"("company");

-- Contact Interactions table
CREATE TABLE IF NOT EXISTS "contact_interactions" (
  "id" SERIAL PRIMARY KEY,
  "contact_id" INTEGER NOT NULL REFERENCES "crm_contacts"("id"),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "interaction_type" VARCHAR NOT NULL,
  "subject" VARCHAR,
  "description" TEXT,
  "outcome" VARCHAR,
  "interaction_date" TIMESTAMP DEFAULT NOW(),
  "duration" INTEGER,
  "follow_up_required" BOOLEAN DEFAULT FALSE,
  "follow_up_date" TIMESTAMP,
  "related_task_id" INTEGER,
  "related_job_id" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "contact_interactions_contact_idx" ON "contact_interactions"("contact_id");
CREATE INDEX "contact_interactions_user_idx" ON "contact_interactions"("user_id");
CREATE INDEX "contact_interactions_date_idx" ON "contact_interactions"("interaction_date");
CREATE INDEX "contact_interactions_followup_idx" ON "contact_interactions"("follow_up_date");

-- Pipeline Stages table
CREATE TABLE IF NOT EXISTS "pipeline_stages" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "pipeline_type" VARCHAR NOT NULL,
  "stage_name" VARCHAR NOT NULL,
  "stage_order" INTEGER NOT NULL,
  "stage_color" VARCHAR DEFAULT '#3B82F6',
  "is_active" BOOLEAN DEFAULT TRUE,
  "auto_move_after_days" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "pipeline_stages_user_idx" ON "pipeline_stages"("user_id");
CREATE INDEX "pipeline_stages_type_idx" ON "pipeline_stages"("pipeline_type");
CREATE INDEX "pipeline_stages_order_idx" ON "pipeline_stages"("stage_order");

-- Pipeline Items table
CREATE TABLE IF NOT EXISTS "pipeline_items" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "stage_id" INTEGER NOT NULL REFERENCES "pipeline_stages"("id"),
  "item_type" VARCHAR NOT NULL,
  "item_title" VARCHAR NOT NULL,
  "item_value" INTEGER,
  "contact_id" INTEGER REFERENCES "crm_contacts"("id"),
  "related_job_id" INTEGER,
  "related_application_id" INTEGER,
  "entered_stage_at" TIMESTAMP DEFAULT NOW(),
  "probability" INTEGER DEFAULT 50,
  "notes" TEXT,
  "custom_data" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "pipeline_items_user_idx" ON "pipeline_items"("user_id");
CREATE INDEX "pipeline_items_stage_idx" ON "pipeline_items"("stage_id");
CREATE INDEX "pipeline_items_contact_idx" ON "pipeline_items"("contact_id");
