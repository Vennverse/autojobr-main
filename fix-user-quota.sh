#!/bin/bash

echo "=== Fixing User Interview Quota ==="
echo ""

cd ~/autojobr-main/autojobr-main

# Check current user data
echo "1. Checking current user data:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "
SELECT id, email, plan_type, subscription_status, ai_model_tier, 
       premium_trial_start_date, premium_trial_end_date, has_used_premium_trial
FROM users 
ORDER BY created_at DESC LIMIT 3;
"

echo ""
echo "2. Checking user_profiles table for interview quotas:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "
SELECT user_id, free_interviews_remaining, total_interviews_used, premium_interviews_remaining
FROM user_profiles 
ORDER BY created_at DESC LIMIT 3;
"

echo ""
echo "3. Updating user to have free interviews and premium trial:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "
UPDATE users SET 
  plan_type = 'premium',
  subscription_status = 'active',
  ai_model_tier = 'premium',
  premium_trial_end_date = NOW() + INTERVAL '30 days',
  has_used_premium_trial = false
WHERE email IS NOT NULL;
"

echo ""
echo "4. Updating user profiles to have interview quota:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "
UPDATE user_profiles SET 
  free_interviews_remaining = 5,
  premium_interviews_remaining = 50,
  total_interviews_used = 0
WHERE user_id IS NOT NULL;
"

echo ""
echo "5. If user_profiles doesn't exist, create it:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "
INSERT INTO user_profiles (user_id, free_interviews_remaining, premium_interviews_remaining, total_interviews_used)
SELECT id, 5, 50, 0 
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET
  free_interviews_remaining = 5,
  premium_interviews_remaining = 50,
  total_interviews_used = 0;
"

echo ""
echo "6. Verification - checking updated data:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "
SELECT u.email, u.plan_type, u.subscription_status, 
       up.free_interviews_remaining, up.premium_interviews_remaining
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC LIMIT 3;
"

echo ""
echo "✅ User quotas updated. Try refreshing the interview page."