
-- Add missing columns to referral_bookings table

-- Payment tracking columns
ALTER TABLE "referral_bookings" 
ADD COLUMN IF NOT EXISTS "payment_country" VARCHAR,
ADD COLUMN IF NOT EXISTS "payment_currency" VARCHAR DEFAULT 'USD';

-- Escrow system columns
ALTER TABLE "referral_bookings" 
ADD COLUMN IF NOT EXISTS "escrow_status" VARCHAR DEFAULT 'held',
ADD COLUMN IF NOT EXISTS "base_amount_released" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "bonus_amount_released" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "escrow_release_date" TIMESTAMP;

-- Meeting verification columns
ALTER TABLE "referral_bookings"
ADD COLUMN IF NOT EXISTS "meeting_scheduled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "meeting_scheduled_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "meeting_confirmed_by_job_seeker" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "meeting_confirmed_by_referrer" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "delivery_confirmed_at" TIMESTAMP;

-- Delivery confirmation columns
ALTER TABLE "referral_bookings"
ADD COLUMN IF NOT EXISTS "delivery_confirmed_by_job_seeker" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "delivery_confirmed_by_referrer" BOOLEAN DEFAULT false;

-- Dispute handling columns
ALTER TABLE "referral_bookings"
ADD COLUMN IF NOT EXISTS "dispute_reason" VARCHAR,
ADD COLUMN IF NOT EXISTS "dispute_details" TEXT,
ADD COLUMN IF NOT EXISTS "disputed_at" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "disputed_by" VARCHAR;

-- Completion tracking
ALTER TABLE "referral_bookings"
ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "referral_bookings_escrow_status_idx" ON "referral_bookings"("escrow_status");
CREATE INDEX IF NOT EXISTS "referral_bookings_meeting_scheduled_idx" ON "referral_bookings"("meeting_scheduled");
CREATE INDEX IF NOT EXISTS "referral_bookings_completed_idx" ON "referral_bookings"("completed_at");

-- Update existing records with default values where needed
UPDATE "referral_bookings" 
SET "payment_currency" = 'USD' 
WHERE "payment_currency" IS NULL;

UPDATE "referral_bookings" 
SET "escrow_status" = 'held' 
WHERE "escrow_status" IS NULL;

UPDATE "referral_bookings" 
SET "base_amount_released" = false 
WHERE "base_amount_released" IS NULL;

UPDATE "referral_bookings" 
SET "bonus_amount_released" = false 
WHERE "bonus_amount_released" IS NULL;

UPDATE "referral_bookings" 
SET "meeting_scheduled" = false 
WHERE "meeting_scheduled" IS NULL;

UPDATE "referral_bookings" 
SET "meeting_confirmed_by_job_seeker" = false 
WHERE "meeting_confirmed_by_job_seeker" IS NULL;

UPDATE "referral_bookings" 
SET "meeting_confirmed_by_referrer" = false 
WHERE "meeting_confirmed_by_referrer" IS NULL;

UPDATE "referral_bookings" 
SET "delivery_confirmed_by_job_seeker" = false 
WHERE "delivery_confirmed_by_job_seeker" IS NULL;

UPDATE "referral_bookings" 
SET "delivery_confirmed_by_referrer" = false 
WHERE "delivery_confirmed_by_referrer" IS NULL;
