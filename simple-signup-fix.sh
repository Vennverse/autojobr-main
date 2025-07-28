#!/bin/bash

echo "🔧 Simple Signup Fix - Clean Database and Restart"

cd ~/autojobr-main

# 1. Clean the database completely
echo "Cleaning corrupted database tables..."
PGPASSWORD="autojobr_2025_secure" psql -h localhost -U autojobr_user -d autojobr << 'EOF'
-- Drop all tables to remove corrupted array data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL ON SCHEMA public TO public;
\q
EOF

echo "✅ Database cleaned"

# 2. Rebuild and push schema
echo "Rebuilding application and pushing clean schema..."
npm run build
source .env
npm run db:push

# 3. Restart application
echo "Restarting application..."
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

sleep 3

# 4. Test signup
echo "Testing signup functionality..."
response=$(curl -s -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test123@example.com","password":"password123","user_type":"job_seeker"}')

echo "Signup response: $response"

# 5. Check application status
echo "Application status:"
pm2 status
pm2 logs autojobr --lines 5

echo ""
echo "✅ Simple signup fix completed"
echo "🌐 Try signup at: http://40.160.50.128"