#!/bin/bash

echo "=== Debugging AutoJobr Login Issue ==="
echo ""

cd ~/autojobr-main/autojobr-main

# Check database connection and tables
echo "1. Checking database connection and tables:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "\dt"

echo ""
echo "2. Checking users table structure:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "\d users"

echo ""
echo "3. Checking if any users exist:"
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "SELECT id, email, verified, created_at FROM users LIMIT 5;"

echo ""
echo "4. Checking session configuration:"
pm2 logs autojobr --lines 50 | grep -i "session\|middleware\|auth"

echo ""
echo "5. Testing API endpoints:"
echo "Testing health endpoint:"
curl -s http://localhost:5000/api/health

echo ""
echo "Testing auth status:"
curl -s http://localhost:5000/api/user

echo ""
echo "6. Checking current environment variables:"
source .env
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "SESSION_SECRET: ${SESSION_SECRET:0:20}..."
echo "GROQ_API_KEY: ${GROQ_API_KEY:0:20}..."
echo "RESEND_API_KEY: ${RESEND_API_KEY:0:20}..."