#!/bin/bash

# AutoJobr Production VM Deployment Script - FIXED VERSION
# This script deploys AutoJobr with all necessary fixes applied
# Version: 2.0 - Fixed all known issues

set -e

echo "🚀 Starting AutoJobr production deployment on Linux VM..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root directly. Use sudo when needed."
   print_error "Run as: bash vm-deployment.sh"
   exit 1
fi

# Check for required commands
command -v curl >/dev/null 2>&1 || { print_error "curl is required but not installed. Install it first."; exit 1; }
command -v git >/dev/null 2>&1 || { print_error "git is required but not installed. Install it first."; exit 1; }

# Check Ubuntu/Debian vs CentOS/RHEL
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    PKG_MANAGER="apt"
elif [ -f /etc/redhat-release ]; then
    DISTRO="rhel"
    PKG_MANAGER="yum"
else
    print_error "Unsupported Linux distribution. This script supports Ubuntu/Debian and CentOS/RHEL."
    exit 1
fi

print_status "Detected $DISTRO-based system using $PKG_MANAGER"

# =============================================================================
# STEP 1: SYSTEM UPDATE AND DEPENDENCIES
# =============================================================================
print_header "Step 1: Updating system packages and installing dependencies"

if [ "$DISTRO" = "debian" ]; then
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget gnupg software-properties-common apt-transport-https ca-certificates lsb-release openssl
else
    sudo yum update -y
    sudo yum install -y curl wget gnupg2 openssl
fi

# =============================================================================
# STEP 2: INSTALL NODE.JS 20
# =============================================================================
print_header "Step 2: Installing Node.js 20"

# Remove existing Node.js versions
if command -v node >/dev/null 2>&1; then
    print_warning "Existing Node.js found. Removing..."
    if [ "$DISTRO" = "debian" ]; then
        sudo apt remove -y nodejs npm
    else
        sudo yum remove -y nodejs npm
    fi
fi

# Install Node.js 20
if [ "$DISTRO" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js installed: $NODE_VERSION"
print_status "NPM installed: $NPM_VERSION"

# =============================================================================
# STEP 3: INSTALL POSTGRESQL
# =============================================================================
print_header "Step 3: Installing and configuring PostgreSQL"

if [ "$DISTRO" = "debian" ]; then
    sudo apt install postgresql postgresql-contrib -y
else
    sudo yum install postgresql-server postgresql-contrib -y
    sudo postgresql-setup initdb
fi

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_status "PostgreSQL installed and started"

# =============================================================================
# STEP 4: INSTALL PM2 AND NGINX
# =============================================================================
print_header "Step 4: Installing PM2 and Nginx"

# Install PM2 globally
sudo npm install -g pm2
print_status "PM2 installed globally"

# Install Nginx
if [ "$DISTRO" = "debian" ]; then
    sudo apt install nginx -y
else
    sudo yum install nginx -y
fi

print_status "Nginx installed"

# =============================================================================
# STEP 5: DATABASE SETUP WITH PROPER PERMISSIONS
# =============================================================================
print_header "Step 5: Setting up PostgreSQL database with proper permissions"

# Generate secure passwords (avoiding special characters that cause sed issues)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

print_status "Generated secure database password"

# Create database and user with proper permissions
sudo -u postgres psql << EOF
-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS autojobr;
DROP USER IF EXISTS autojobr_user;

-- Create new database and user
CREATE DATABASE autojobr;
CREATE USER autojobr_user WITH PASSWORD '$DB_PASSWORD';

-- Grant comprehensive permissions
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
ALTER USER autojobr_user CREATEDB;
ALTER USER autojobr_user SUPERUSER;

-- Connect to the database and grant schema permissions
\c autojobr
GRANT ALL ON SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO autojobr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO autojobr_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO autojobr_user;

\q
EOF

print_status "Database 'autojobr' created with proper permissions"

# =============================================================================
# STEP 6: CLONE AND SETUP APPLICATION
# =============================================================================
print_header "Step 6: Cloning AutoJobr repository and installing dependencies"

# Remove existing directory if present
if [ -d "autojobr-main" ]; then
    print_warning "Removing existing autojobr-main directory..."
    rm -rf autojobr-main
fi

# Clone the repository
print_status "Cloning AutoJobr repository..."
git clone https://github.com/Vennverse/autojobr-main.git

# Navigate to application directory
cd autojobr-main

# Install application dependencies
print_status "Installing application dependencies..."
npm install

# =============================================================================
# STEP 7: ENVIRONMENT CONFIGURATION
# =============================================================================
print_header "Step 7: Creating environment configuration"

# Create comprehensive .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://autojobr_user:$DB_PASSWORD@localhost:5432/autojobr"

# Server Configuration
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="$SESSION_SECRET"

# API Keys - CONFIGURE THESE FOR FULL FUNCTIONALITY
# Get GROQ API key from: https://console.groq.com/
# Get RESEND API key from: https://resend.com/
GROQ_API_KEY=""
RESEND_API_KEY=""

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Payment Configuration (Optional)
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
STRIPE_SECRET_KEY=""

# Email Configuration (Optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EOF

print_status "Environment configuration created"

# =============================================================================
# STEP 8: DATABASE SCHEMA SETUP
# =============================================================================
print_header "Step 8: Setting up database schema"

# Export environment variables
set -a
source .env
set +a

# Push database schema
print_status "Pushing database schema..."
npm run db:push
print_status "Database schema created successfully"

# =============================================================================
# STEP 9: BUILD APPLICATION
# =============================================================================
print_header "Step 9: Building application for production"

print_status "Building application..."
npm run build
print_status "Application build completed"

# =============================================================================
# STEP 10: PM2 CONFIGURATION
# =============================================================================
print_header "Step 10: Configuring PM2 for production deployment"

# Create logs directory
mkdir -p logs

# Create PM2 ecosystem configuration
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
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
}
EOF

print_status "PM2 configuration created"

# =============================================================================
# STEP 11: START APPLICATION WITH PM2
# =============================================================================
print_header "Step 11: Starting application with PM2"

# Kill any existing PM2 processes
pm2 delete autojobr 2>/dev/null || true

# Start application with environment variables loaded
source .env
export $(cat .env | grep -v '^#' | grep -v '^$' | cut -d= -f1)

pm2 start ecosystem.config.cjs
pm2 save

print_status "Application started with PM2"

# Setup PM2 to start on boot
print_status "Configuring PM2 to start on system boot..."
sudo env PATH=$PATH:/usr/bin $(which pm2) startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))

# =============================================================================
# STEP 12: NGINX CONFIGURATION
# =============================================================================
print_header "Step 12: Configuring Nginx reverse proxy"

# Remove default Nginx configuration
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Create AutoJobr Nginx configuration
sudo tee /etc/nginx/sites-available/autojobr > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # File upload size
    client_max_body_size 10M;

    # Proxy configuration
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF

# Enable the site
if [ "$DISTRO" = "debian" ]; then
    sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
else
    sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/conf.d/autojobr.conf
fi

# Test Nginx configuration
sudo nginx -t
if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_status "Nginx configured and started"

# =============================================================================
# STEP 13: FIREWALL CONFIGURATION
# =============================================================================
print_header "Step 13: Configuring firewall"

if command -v ufw >/dev/null 2>&1; then
    # Ubuntu/Debian UFW
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    echo "y" | sudo ufw enable
    print_status "UFW firewall configured"
elif command -v firewall-cmd >/dev/null 2>&1; then
    # CentOS/RHEL firewalld
    sudo firewall-cmd --permanent --add-service=ssh
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
    print_status "Firewalld configured"
else
    print_warning "No supported firewall found. Configure manually if needed."
fi

# =============================================================================
# STEP 14: FINAL VERIFICATION
# =============================================================================
print_header "Step 14: Verifying deployment"

# Wait for application to fully start
sleep 5

# Check services
POSTGRES_STATUS="❌"
NGINX_STATUS="❌"
PM2_STATUS="❌"

if sudo systemctl is-active --quiet postgresql; then
    POSTGRES_STATUS="✅"
fi

if sudo systemctl is-active --quiet nginx; then
    NGINX_STATUS="✅"
fi

if pm2 status | grep -q "autojobr.*online"; then
    PM2_STATUS="✅"
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unable to determine IP")
fi

# =============================================================================
# DEPLOYMENT SUMMARY
# =============================================================================
echo ""
echo "=============================================="
echo "🎉 AUTOJOBR DEPLOYMENT COMPLETED!"
echo "=============================================="
echo ""
echo "📊 SERVICE STATUS:"
echo "   PostgreSQL: $POSTGRES_STATUS"
echo "   Nginx:      $NGINX_STATUS"
echo "   AutoJobr:   $PM2_STATUS"
echo ""
echo "🌐 APPLICATION ACCESS:"
echo "   Primary URL: http://$SERVER_IP"
echo "   Health Check: http://$SERVER_IP/api/health"
echo ""
echo "🔑 DATABASE CREDENTIALS:"
echo "   Database: autojobr"
echo "   Username: autojobr_user"
echo "   Password: $DB_PASSWORD"
echo ""
echo "⚠️  NEXT STEPS REQUIRED:"
echo "   1. Configure API keys in .env file:"
echo "      cd ~/autojobr-main"
echo "      nano .env"
echo ""
echo "   2. Add your API keys (optional but recommended):"
echo "      - GROQ_API_KEY: Get from https://console.groq.com/"
echo "      - RESEND_API_KEY: Get from https://resend.com/"
echo "      - GOOGLE_CLIENT_ID & SECRET: For OAuth login"
echo ""
echo "   3. Restart application after adding keys:"
echo "      pm2 restart autojobr"
echo ""
echo "=============================================="
echo "📋 MANAGEMENT COMMANDS:"
echo "=============================================="
echo "   Check status:     pm2 status"
echo "   View logs:        pm2 logs autojobr"
echo "   Restart app:      pm2 restart autojobr"
echo "   Stop app:         pm2 stop autojobr"
echo "   Database access:  sudo -u postgres psql autojobr"
echo "   Nginx reload:     sudo systemctl reload nginx"
echo "=============================================="
echo ""
echo "🚀 AutoJobr is now running in production mode!"
echo "   Visit http://$SERVER_IP to access your application"
echo ""

if [ "$PM2_STATUS" = "✅" ] && [ "$NGINX_STATUS" = "✅" ] && [ "$POSTGRES_STATUS" = "✅" ]; then
    print_status "All services are running successfully! 🎉"
    echo ""
    print_warning "Remember to:"
    print_warning "• Set up SSL certificate (Let's Encrypt recommended)"
    print_warning "• Configure your domain name"
    print_warning "• Set up regular database backups"
    print_warning "• Add API keys for full functionality"
else
    print_warning "Some services may not be running correctly."
    print_warning "Check the status and logs using the commands above."
fi

echo ""
print_status "Deployment script completed! Happy deploying! 🚀"