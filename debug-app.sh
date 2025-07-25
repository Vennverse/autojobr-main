#!/bin/bash

echo "🔧 Complete Database and Application Debug/Fix Script"
echo "=================================================="

cd ~/autojobr-main || { echo "❌ autojobr-main directory not found"; exit 1; }

# 1. Check current PostgreSQL status
echo "📊 Checking PostgreSQL status..."
sudo systemctl status postgresql --no-pager -l

# 2. Check if database exists
echo "📋 Checking if database exists..."
sudo -u postgres psql -l | grep autojobr || echo "Database autojobr not found"

# 3. Reset database user completely
echo "🔑 Resetting database user and permissions..."
sudo -u postgres psql << 'EOF'
-- Drop existing user and recreate
DROP USER IF EXISTS autojobr_user;
CREATE USER autojobr_user WITH PASSWORD 'autojobr_2025_secure';

-- Grant database permissions
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
GRANT CONNECT ON DATABASE autojobr TO autojobr_user;

-- Connect to database and set schema permissions
\c autojobr

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT USAGE ON SCHEMA public TO autojobr_user;

-- Grant table and sequence permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;

-- Make user owner of the database for full access
ALTER DATABASE autojobr OWNER TO autojobr_user;

\q
EOF

# 4. Update .env file with correct connection string
echo "📝 Updating .env file..."
cp .env .env.backup.$(date +%s)

# Create new .env with correct DATABASE_URL
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://autojobr_user:autojobr_2025_secure@localhost:5432/autojobr"
SESSION_SECRET="your_session_secret_here_change_in_production_$(date +%s)"
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"
EOF

echo "✅ .env file updated"

# 5. Test database connection
echo "🧪 Testing database connection..."
PGPASSWORD="autojobr_2025_secure" psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1 as test;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Trying to diagnose the issue..."
    
    # Check if user was created
    sudo -u postgres psql -c "\du" | grep autojobr_user || echo "User not found"
    
    # Check database ownership
    sudo -u postgres psql -c "\l" | grep autojobr || echo "Database not found"
fi

# 6. Install missing dependencies and rebuild
echo "📦 Checking and installing dependencies..."
npm install

# 7. Build application
echo "🔨 Building application..."
npm run build

# 8. Push database schema
echo "📊 Pushing database schema..."
source .env
npm run db:push

# 9. Restart application
echo "🔄 Restarting application..."
source .env
export $(cat .env | grep -v '^#' | xargs)

# Stop PM2 completely and restart
pm2 delete autojobr 2>/dev/null || echo "No existing PM2 process"
pm2 start ecosystem.config.cjs

# 10. Check application status
echo "📊 Application status after restart:"
sleep 3
pm2 status
pm2 logs autojobr --lines 10

# 11. Test API endpoints
echo "🧪 Testing API endpoints..."
curl -s http://localhost:5000/api/health || echo "Health check failed"
curl -s http://localhost:5000/api/auth/providers | jq . || echo "Auth providers failed"

echo ""
echo "✅ Debug and fix script completed"
echo "🌐 Try accessing your app at: http://40.160.50.128"
echo ""
echo "📋 If signup still fails, check the logs:"
echo "   pm2 logs autojobr --lines 20"