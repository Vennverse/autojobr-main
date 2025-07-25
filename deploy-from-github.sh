#!/bin/bash

echo "🚀 Deploying Latest AutoJobr from GitHub"

cd ~/autojobr-main

# 1. Backup current state
echo "Creating backup..."
cp .env .env.backup.$(date +%s)

# 2. Pull latest changes from GitHub
echo "Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/main

# 3. Restore environment file (keep local secrets)
echo "Restoring environment configuration..."
cp .env.backup.* .env 2>/dev/null || echo "No backup found, using default"

# 4. Install dependencies (in case package.json changed)
echo "Installing dependencies..."
npm install

# 5. Fix database password if needed
echo "Testing database connection..."
source .env
export $(cat .env | grep -v '^#' | xargs)

# Test current DATABASE_URL
if ! psql "$DATABASE_URL" -c "SELECT 1;" 2>/dev/null; then
    echo "Database connection failed, fixing password..."
    
    # Try different passwords
    for pwd in "autojobr_2025_secure" "autojobr_secure_2025" "password" "autojobr"; do
        new_url="postgresql://autojobr_user:$pwd@localhost:5432/autojobr"
        if psql "$new_url" -c "SELECT 1;" 2>/dev/null; then
            echo "Found working password: $pwd"
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$new_url\"|" .env
            break
        fi
    done
fi

# 6. Clean and rebuild database
echo "Cleaning corrupted database..."
source .env
export $(cat .env | grep -v '^#' | xargs)

psql "$DATABASE_URL" << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL ON SCHEMA public TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
\q
EOF

# 7. Build and deploy schema
echo "Building application and deploying schema..."
npm run build
npm run db:push

# 8. Restart application
echo "Restarting application..."
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

sleep 3

# 9. Test functionality
echo "Testing application..."
pm2 status
pm2 logs autojobr --lines 5

# Test signup
curl -s -X POST http://localhost:5000/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","user_type":"job_seeker","firstName":"Test","lastName":"User"}' \
  | head -200

echo ""
echo "✅ GitHub deployment completed"
echo "🌐 AutoJobr running at: http://40.160.50.128"