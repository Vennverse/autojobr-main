
-- Add BYOK (Bring Your Own Key) fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS byok_groq_api_key TEXT,
ADD COLUMN IF NOT EXISTS byok_key_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS byok_key_last_used TIMESTAMP;

-- Add index for faster BYOK key lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_byok_enabled ON user_profiles(byok_key_enabled);
