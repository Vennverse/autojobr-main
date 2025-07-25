#!/bin/bash

echo "🔧 Final Database Fix - Handling Existing User"

cd ~/autojobr-main

# 1. Fix the existing user password without dropping
echo "🔑 Updating existing user password..."
sudo -u postgres psql << 'EOF'
-- Change password for existing user
ALTER USER autojobr_user WITH PASSWORD 'autojobr_2025_secure';

-- Ensure all permissions are granted
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
GRANT CONNECT ON DATABASE autojobr TO autojobr_user;

-- Connect to database
\c autojobr

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT USAGE ON SCHEMA public TO autojobr_user;
GRANT CREATE ON SCHEMA public TO autojobr_user;

-- Grant permissions on existing objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO autojobr_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO autojobr_user;

\q
EOF

# 2. Update .env with correct connection string
echo "📝 Updating .env file..."
cp .env .env.backup.$(date +%s)

# Update just the DATABASE_URL line
sed -i 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://autojobr_user:autojobr_2025_secure@localhost:5432/autojobr"|' .env

# Add missing environment variables if they don't exist
if ! grep -q "NODE_ENV=" .env; then
    echo 'NODE_ENV=production' >> .env
fi

if ! grep -q "PORT=" .env; then
    echo 'PORT=5000' >> .env
fi

if ! grep -q "SESSION_SECRET=" .env; then
    echo "SESSION_SECRET=\"autojobr_session_$(date +%s)\"" >> .env
fi

# 3. Test database connection
echo "🧪 Testing database connection..."
PGPASSWORD="autojobr_2025_secure" psql -h localhost -U autojobr_user -d autojobr -c "SELECT current_user, current_database();" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
    
    # 4. Push schema to database
    echo "📊 Pushing database schema..."
    source .env
    npm run db:push
    
    if [ $? -eq 0 ]; then
        echo "✅ Schema pushed successfully"
    else
        echo "⚠️ Schema push had issues, but continuing..."
    fi
    
    # 5. Restart application
    echo "🔄 Restarting application..."
    source .env
    export $(cat .env | grep -v '^#' | xargs)
    pm2 restart autojobr
    
    sleep 3
    
    # 6. Check application status
    echo "📊 Application status:"
    pm2 status
    
    echo "🔍 Recent logs:"
    pm2 logs autojobr --lines 5
    
    # 7. Test signup endpoint
    echo "🧪 Testing signup functionality..."
    curl -s -X POST http://localhost:5000/api/auth/email/signup \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"password123","user_type":"job_seeker"}' \
      | grep -o '"message":"[^"]*"' || echo "Signup test completed"
    
else
    echo "❌ Database connection still failing"
    echo "Let's diagnose further..."
    
    # Show user info
    sudo -u postgres psql -c "\du autojobr_user"
    
    # Show database info
    sudo -u postgres psql -c "\l" | grep autojobr
fi

echo ""
echo "✅ Final fix completed"
echo "🌐 Try signup at: http://40.160.50.128"