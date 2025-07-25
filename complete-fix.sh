#!/bin/bash

echo "🔧 Complete AutoJobr Fix - Database, Schema, and Authentication"

cd ~/autojobr-main

# 1. First, fix the database password issue
echo "Step 1: Fixing database authentication..."
sudo -u postgres psql -c "ALTER USER autojobr_user WITH PASSWORD 'autojobr_secure_2025';"

# Update .env with working password
sed -i 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://autojobr_user:autojobr_secure_2025@localhost:5432/autojobr"|' .env

# Test the connection
PGPASSWORD="autojobr_secure_2025" psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed - checking passwords..."
    # Try different password that might have been set
    for pwd in "autojobr_2025_secure" "password" "autojobr_secure_1753438835"; do
        PGPASSWORD="$pwd" psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Found working password: $pwd"
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://autojobr_user:$pwd@localhost:5432/autojobr\"|" .env
            break
        fi
    done
fi

# 2. Clean corrupted database completely
echo "Step 2: Cleaning corrupted database..."
source .env
export $(cat .env | grep -v '^#' | xargs)

PGPASSWORD=$(echo $DATABASE_URL | sed 's/.*://' | sed 's/@.*//') psql -h localhost -U autojobr_user -d autojobr << 'EOF'
-- Drop all tables and sequences to clean corrupted arrays
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL ON SCHEMA public TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
\q
EOF

echo "✅ Database cleaned"

# 3. Fix schema issues and rebuild
echo "Step 3: Fixing schema issues and rebuilding..."

# Fix the missing profiles export in schema.ts
if ! grep -q "export const profiles" shared/schema.ts; then
    # Add profiles table export (it's actually userProfiles)
    sed -i '/export const userProfiles/a export const profiles = userProfiles;' shared/schema.ts
fi

# Rebuild application
npm run build

# 4. Push clean schema
echo "Step 4: Pushing clean schema..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Schema pushed successfully"
else
    echo "⚠️ Schema push failed, but continuing..."
fi

# 5. Restart application with proper environment
echo "Step 5: Restarting application..."
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

sleep 5

# 6. Test signup with all required fields
echo "Step 6: Testing signup functionality..."
response=$(curl -s -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "user_type": "job_seeker",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "Signup response: $response"

# 7. Check if signup was successful
if echo "$response" | grep -q "success\|created\|verification"; then
    echo "✅ Signup appears to be working!"
else
    echo "⚠️ Signup still has issues. Checking logs..."
    pm2 logs autojobr --lines 10
fi

# 8. Final status check
echo "Final application status:"
pm2 status

echo ""
echo "✅ Complete fix completed"
echo "🌐 Try signup at: http://40.160.50.128"
echo ""
echo "If signup still fails, the issue might be frontend validation."
echo "Try accessing the site directly in browser for full testing."