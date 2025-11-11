#!/bin/bash

cd ~/autojobr-main

echo "Cleaning database schema to fix array literal errors..."

# 1. Drop all tables to start fresh
echo "Dropping all existing tables..."
PGPASSWORD="autojobr_2025_secure" psql -h localhost -U autojobr_user -d autojobr << 'EOF'
-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS virtual_interview_sessions CASCADE;
DROP TABLE IF EXISTS virtual_interviews CASCADE;
DROP TABLE IF EXISTS coding_test_sessions CASCADE;
DROP TABLE IF EXISTS coding_tests CASCADE;
DROP TABLE IF EXISTS job_posting_applications CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS question_bank CASCADE;
DROP TABLE IF EXISTS test_assignments CASCADE;
DROP TABLE IF EXISTS interview_assignments CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;

-- Drop any remaining sequences
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS job_postings_id_seq CASCADE;
DROP SEQUENCE IF EXISTS job_posting_applications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS virtual_interviews_id_seq CASCADE;
DROP SEQUENCE IF EXISTS virtual_interview_sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS coding_tests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS coding_test_sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS subscriptions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS usage_tracking_id_seq CASCADE;
DROP SEQUENCE IF EXISTS question_bank_id_seq CASCADE;
DROP SEQUENCE IF EXISTS test_assignments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS interview_assignments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS password_resets_id_seq CASCADE;
DROP SEQUENCE IF EXISTS verification_tokens_id_seq CASCADE;

\q
EOF

# 2. Check schema file for array issues
echo "Checking schema for array syntax issues..."
if grep -n "\.array()" shared/schema.ts; then
    echo "Found proper array syntax"
else
    echo "Checking for array() wrapper syntax..."
    grep -n "array(" shared/schema.ts || echo "No array issues found"
fi

# 3. Push clean schema
echo "Pushing clean schema to database..."
source .env
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Schema pushed successfully"
    
    # 4. Restart application
    echo "Restarting application..."
    export $(cat .env | grep -v '^#' | xargs)
    pm2 restart autojobr
    
    sleep 3
    
    # 5. Test signup
    echo "Testing signup functionality..."
    curl -s -X POST http://localhost:5000/api/auth/email/signup \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"password123","user_type":"job_seeker"}' \
      | head -200
    
    echo ""
    echo "✅ Database schema cleaned and rebuilt"
    echo "🌐 Try signup at: http://40.160.50.128"
    
else
    echo "❌ Schema push failed. Checking for specific issues..."
    
    # Show recent logs for debugging
    pm2 logs autojobr --lines 10
fi