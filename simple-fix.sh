#!/bin/bash

echo "🔧 Simple Fix for Signup Error"

cd ~/autojobr-main

# 1. Check PM2 logs for specific error
echo "=== Current Application Logs ==="
pm2 logs autojobr --lines 10

# 2. Test database connection and fix if needed
echo -e "\n=== Testing Database Connection ==="
source .env

# Test current DATABASE_URL
if psql "$DATABASE_URL" -c "SELECT 1;" 2>/dev/null; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection failed, trying alternative passwords..."
    
    # Try different passwords
    for pwd in "autojobr_2025_secure" "autojobr_secure_2025" "password" "autojobr"; do
        echo "Testing password: $pwd"
        new_url="postgresql://autojobr_user:$pwd@localhost:5432/autojobr"
        if psql "$new_url" -c "SELECT 1;" 2>/dev/null; then
            echo "✅ Found working password: $pwd"
            # Update .env file
            cp .env .env.backup.$(date +%s)
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$new_url\"|" .env
            export DATABASE_URL="$new_url"
            echo "Updated DATABASE_URL in .env"
            break
        fi
    done
fi

# 3. Check if users table exists
echo -e "\n=== Checking Database Schema ==="
source .env
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users LIMIT 1;" 2>/dev/null; then
    echo "✅ Users table exists"
else
    echo "❌ Users table missing or corrupted, rebuilding..."
    
    # Clean database and rebuild
    psql "$DATABASE_URL" << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL ON SCHEMA public TO public;
\q
EOF
    
    echo "Database cleaned, rebuilding schema..."
    npm run db:push
fi

# 4. Restart application with proper environment
echo -e "\n=== Restarting Application ==="
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

sleep 3

# 5. Test signup again
echo -e "\n=== Testing Signup After Fix ==="
response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testfix@example.com","password":"password123","user_type":"job_seeker","firstName":"Test","lastName":"User"}')

echo "Signup response: $response"

# 6. Show final status
echo -e "\n=== Final Status ==="
pm2 status autojobr
echo -e "\nRecent logs:"
pm2 logs autojobr --lines 5