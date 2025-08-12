#!/bin/bash

cd ~/autojobr-main

echo "🔧 Fixing database authentication and connection..."

# Get the current password from deployment script
DB_PASSWORD=$(grep "DB_PASSWORD=" vm-deploy.sh | cut -d'"' -f2 | head -1)
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD="autojobr_secure_$(date +%s)"
    echo "Generated new password: $DB_PASSWORD"
fi

echo "📋 Checking current database status..."
sudo -u postgres psql -c "\du" 2>/dev/null || echo "PostgreSQL not accessible"

# Reset the database user and permissions
echo "🔑 Resetting database user and permissions..."
sudo -u postgres psql << EOF
-- Drop existing user if exists
DROP USER IF EXISTS autojobr_user;

-- Create user with proper password
CREATE USER autojobr_user WITH PASSWORD '$DB_PASSWORD';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;

-- Connect to database and grant schema permissions
\c autojobr
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;

\q
EOF

# Update the .env file with correct connection string
echo "📝 Updating .env file..."
DB_CONNECTION_STRING="postgresql://autojobr_user:$DB_PASSWORD@localhost:5432/autojobr"

# Backup current .env
cp .env .env.backup

# Update DATABASE_URL in .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DB_CONNECTION_STRING\"|" .env

echo "🔄 Updated DATABASE_URL in .env file"

# Test database connection
echo "🧪 Testing database connection..."
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;" 2>/dev/null && echo "✅ Database connection successful" || echo "❌ Database connection failed"

# Push schema to database
echo "📊 Pushing schema to database..."
source .env
npm run db:push

# Restart application with new connection
echo "🔄 Restarting application..."
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

echo "✅ Database fix completed"
sleep 3

echo "📊 Application status:"
pm2 status

echo ""
echo "🔍 Recent logs:"
pm2 logs autojobr --lines 10