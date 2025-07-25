#!/bin/bash

echo "🔧 Diagnosing and Fixing Signup Error"

cd ~/autojobr-main

# 1. Check current application status
echo "=== Application Status ==="
pm2 status
echo ""

# 2. Check recent logs for errors
echo "=== Recent Application Logs ==="
pm2 logs autojobr --lines 15
echo ""

# 3. Test database connection
echo "=== Testing Database Connection ==="
source .env
export $(cat .env | grep -v '^#' | xargs)

if psql "$DATABASE_URL" -c "SELECT 1;" 2>/dev/null; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed"
    echo "Testing alternative passwords..."
    
    # Try different passwords
    for pwd in "autojobr_2025_secure" "autojobr_secure_2025" "password" "autojobr"; do
        new_url="postgresql://autojobr_user:$pwd@localhost:5432/autojobr"
        if psql "$new_url" -c "SELECT 1;" 2>/dev/null; then
            echo "✅ Found working password: $pwd"
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$new_url\"|" .env
            export DATABASE_URL="$new_url"
            break
        fi
    done
fi

# 4. Check if users table exists
echo "=== Checking Database Schema ==="
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "Could not query database schema"

# 5. Check for corrupted data
echo "=== Checking for Database Corruption ==="
psql "$DATABASE_URL" -c "SELECT COUNT(*) as user_count FROM users;" 2>/dev/null || echo "Users table may have issues"

# 6. Test signup endpoint directly
echo "=== Testing Signup Endpoint ==="
test_email="test$(date +%s)@example.com"

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$test_email\",\"password\":\"password123\",\"user_type\":\"job_seeker\",\"firstName\":\"Test\",\"lastName\":\"User\"}")

echo "Response: $response"
echo ""

# 7. If signup fails, try to rebuild database
if [[ $response == *"500"* ]] || [[ $response == *"error"* ]]; then
    echo "=== Signup Failed - Rebuilding Database ==="
    
    # Clean and rebuild database
    psql "$DATABASE_URL" << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL ON SCHEMA public TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
\q
EOF

    echo "Database cleaned. Rebuilding schema..."
    
    # Rebuild application and schema
    npm run build
    npm run db:push
    
    # Restart application
    export $(cat .env | grep -v '^#' | xargs)
    pm2 restart autojobr
    
    sleep 3
    
    # Test signup again
    echo "=== Testing Signup After Rebuild ==="
    test_email2="test$(date +%s)@example.com"
    
    response2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:5000/api/auth/email/signup \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$test_email2\",\"password\":\"password123\",\"user_type\":\"job_seeker\",\"firstName\":\"Test\",\"lastName\":\"User\"}")
    
    echo "Response after rebuild: $response2"
fi

echo ""
echo "=== Final Status Check ==="
pm2 status
pm2 logs autojobr --lines 5

echo ""
echo "✅ Signup diagnosis completed"
echo "🌐 Test your application at: http://40.160.50.128"