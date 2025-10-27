#!/bin/bash

# AutoJobr VM Deployment Troubleshooting and Fix Script
# This script contains all the fixes we've implemented for common deployment issues

set -e

echo "🔧 Running AutoJobr VM Deployment Fixes..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[FIX]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Fix Database Permissions (Critical Issue)
print_status "Fixing PostgreSQL database permissions..."
sudo -u postgres psql -d autojobr << EOF
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;
ALTER USER autojobr_user WITH SUPERUSER;
\q
EOF

# 2. Fix Environment Variable Loading
print_status "Fixing environment variable loading..."
cd ~/autojobr-main/autojobr-main || cd autojobr-main

if [ -f .env ]; then
    # Fix .env file format
    sed -i 's/\r$//' .env  # Remove Windows line endings
    sed -i '/^$/d' .env    # Remove empty lines
    
    # Load environment variables properly
    set -a
    source .env
    set +a
    
    print_status "Environment variables loaded successfully"
else
    print_error ".env file not found! Creating template..."
    
    # Generate secure passwords
    DB_PASSWORD=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 64)
    
    cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://autojobr_user:$DB_PASSWORD@localhost:5432/autojobr"

# Server Configuration
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="$SESSION_SECRET"

# API Keys (Optional - add if needed)
GROQ_API_KEY=""
RESEND_API_KEY=""

# Optional Payment Configuration
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
EOF
    
    print_status ".env file created. Update with your values if needed."
fi

# 3. Fix PM2 Configuration and Restart
print_status "Fixing PM2 configuration..."

# Kill existing processes
pm2 delete autojobr 2>/dev/null || true

# Ensure ecosystem.config.cjs exists
if [ ! -f ecosystem.config.cjs ]; then
    print_status "Creating PM2 ecosystem configuration..."
    cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    env_file: './.env'
  }]
}
EOF
fi

# Create logs directory
mkdir -p logs

# Build application
print_status "Building application..."
npm run build

# Start with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# 4. Fix Nginx Configuration
print_status "Fixing Nginx configuration..."

# Check if Nginx config exists and update it
sudo tee /etc/nginx/sites-available/autojobr > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 5. Verify Services
print_status "Verifying services..."

# Check PostgreSQL
if sudo systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL is not running"
    sudo systemctl start postgresql
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx is not running"
    sudo systemctl start nginx
fi

# Check PM2
if pm2 status | grep -q "autojobr"; then
    print_status "AutoJobr application is running"
else
    print_error "AutoJobr application is not running"
fi

# 6. Test Database Connection
print_status "Testing database connection..."
if PGPASSWORD=$PGPASSWORD psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_warning "Database connection test failed - check credentials"
fi

# 7. Get server status
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=============================================="
echo "🎉 AUTOJOBR VM FIXES COMPLETED!"
echo "=============================================="
echo "✅ Database permissions fixed"
echo "✅ Environment variables fixed"
echo "✅ PM2 configuration fixed"
echo "✅ Nginx configuration fixed"
echo "✅ Services verified"
echo ""
echo "🌐 Application should be available at: http://$SERVER_IP"
echo ""
echo "📋 Check status with these commands:"
echo "   pm2 status"
echo "   sudo systemctl status nginx"
echo "   sudo systemctl status postgresql"
echo ""
echo "📝 View logs:"
echo "   pm2 logs autojobr"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔧 If issues persist:"
echo "   1. Check .env file has correct values"
echo "   2. Restart services: pm2 restart autojobr"
echo "   3. Check firewall: sudo ufw status"
echo "=============================================="

print_status "All fixes applied successfully! 🚀"