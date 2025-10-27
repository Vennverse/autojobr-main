
-- Add payment_provider column to referral_bookings table
ALTER TABLE "referral_bookings" 
ADD COLUMN IF NOT EXISTS "payment_provider" VARCHAR;

-- Update existing records to use 'paypal' as default
UPDATE "referral_bookings" 
SET "payment_provider" = 'paypal' 
WHERE "payment_provider" IS NULL;
