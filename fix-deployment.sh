#!/bin/bash

# AutoJobr Deployment Recovery Script
# This script fixes the database permissions issue for existing deployments

set -e

echo "🔧 Starting AutoJobr deployment recovery..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the AutoJobr project root directory"
    print_error "Expected to find package.json in current directory"
    exit 1
fi

print_status "Found package.json - we're in the right directory"

# Stop the current application
print_status "Stopping current PM2 processes..."
pm2 stop autojobr || true
pm2 delete autojobr || true

# Check if database exists and get the password
print_status "Checking database configuration..."

if [ -f ".env" ]; then
    source .env
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not found in .env file"
        exit 1
    fi
    
    # Extract password from DATABASE_URL
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
    print_status "Found existing database password"
else
    print_error ".env file not found. Please ensure the deployment was partially completed."
    exit 1
fi

# Fix database permissions
print_status "Fixing PostgreSQL database permissions..."

# Grant superuser privileges to fix permission issues
sudo -u postgres psql << EOF
ALTER USER autojobr_user SUPERUSER;
\q
EOF

# Grant additional schema permissions
sudo -u postgres psql -d autojobr << EOF
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
\q
EOF

print_status "Database permissions fixed"

# Test database connection
print_status "Testing database connection..."
export $(cat .env | grep -v '^#' | xargs)
npm run db:push

if [ $? -eq 0 ]; then
    print_status "✅ Database schema setup successful"
else
    print_error "❌ Database schema setup failed"
    exit 1
fi

# Build application if needed
if [ ! -f "dist/index.js" ]; then
    print_status "Building application..."
    npm run build
fi

# Create a simple PM2 ecosystem file that uses env_file
print_status "Creating fixed PM2 configuration..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    env_file: '.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
print_status "Starting application with PM2..."
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 start ecosystem.config.cjs
pm2 save

# Check if application started successfully
sleep 3
if pm2 list | grep -q "autojobr.*online"; then
    print_status "✅ Application started successfully"
else
    print_error "❌ Application failed to start"
    print_status "Checking logs..."
    pm2 logs autojobr --lines 10
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

print_status "🎉 AutoJobr deployment recovery completed successfully!"
echo ""
echo "=============================================="
echo "🚀 RECOVERY SUMMARY"
echo "=============================================="
echo "✅ Database permissions fixed"
echo "✅ PM2 configuration updated"
echo "✅ Application restarted successfully"
echo ""
echo "🌐 Application URL: http://$SERVER_IP"
echo ""
echo "⚠️  IMPORTANT: You still need to configure API keys!"
echo "Edit .env file and add your API keys:"
echo "   - GROQ_API_KEY (get from console.groq.com)"
echo "   - RESEND_API_KEY (get from resend.com)"
echo ""
echo "Then restart the application:"
echo "   source .env"
echo "   export \$(cat .env | grep -v '^#' | xargs)"
echo "   pm2 restart autojobr"
echo ""
echo "=============================================="
echo "📋 USEFUL COMMANDS"
echo "=============================================="
echo "Check application status: pm2 status"
echo "View logs: pm2 logs autojobr"
echo "Restart application: pm2 restart autojobr"
echo "View database: sudo -u postgres psql autojobr"
echo "=============================================="
echo ""
print_status "Your deployment is now working! 🚀"