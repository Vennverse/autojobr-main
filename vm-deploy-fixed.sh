#!/bin/bash

# AutoJobr Linux VM Deployment Script - Fixed Version
# This script fixes the database permissions and sed command issues

set -e

echo "🚀 Starting AutoJobr deployment on Linux VM..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root directly. Use sudo when needed."
   exit 1
fi

# Check Ubuntu/Debian vs CentOS/RHEL
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    PKG_MANAGER="apt"
elif [ -f /etc/redhat-release ]; then
    DISTRO="rhel"
    PKG_MANAGER="yum"
else
    print_error "Unsupported Linux distribution"
    exit 1
fi

print_status "Detected $DISTRO-based system"

# Update system packages
print_status "Updating system packages..."
if [ "$DISTRO" = "debian" ]; then
    sudo apt update && sudo apt upgrade -y
else
    sudo yum update -y
fi

# Install Node.js 20
print_status "Installing Node.js 20..."
if [ "$DISTRO" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
print_status "Node.js installed: $NODE_VERSION"

# Install PostgreSQL
print_status "Installing PostgreSQL..."
if [ "$DISTRO" = "debian" ]; then
    sudo apt install postgresql postgresql-contrib -y
else
    sudo yum install postgresql-server postgresql-contrib -y
    sudo postgresql-setup initdb
fi

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx (optional)
print_status "Installing Nginx..."
if [ "$DISTRO" = "debian" ]; then
    sudo apt install nginx -y
else
    sudo yum install nginx -y
fi

# Setup database with proper permissions
print_status "Setting up PostgreSQL database with proper permissions..."

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

print_status "Generated database password: $DB_PASSWORD"

# Create database and user
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS autojobr;
DROP USER IF EXISTS autojobr_user;
CREATE DATABASE autojobr;
CREATE USER autojobr_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
ALTER USER autojobr_user CREATEDB;
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

print_status "Database created with proper permissions"

# Clone the repository if not already present
if [ ! -d "autojobr-main" ]; then
    print_status "Cloning AutoJobr repository..."
    git clone https://github.com/Vennverse/autojobr-main.git
fi

# Navigate to application directory
cd autojobr-main

# Install application dependencies
print_status "Installing application dependencies..."
npm install

# Create .env file
print_status "Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://autojobr_user:$DB_PASSWORD@localhost:5432/autojobr"

# Server Configuration
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="$SESSION_SECRET"

# API Keys (YOU NEED TO SET THESE)
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"

# Optional Payment Configuration
PAYPAL_CLIENT_ID="your_paypal_client_id_here"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret_here"

# Optional SMTP Configuration
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EOF

# Set up database schema
print_status "Setting up database schema..."
source .env
export $(cat .env | grep -v '^#' | xargs)
npm run db:push

# Build application
print_status "Building application..."
npm run build

# Create PM2 ecosystem file with proper environment loading
print_status "Creating PM2 configuration..."
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

# Start application with PM2 using environment variables
print_status "Starting application with PM2..."
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 to start on boot
print_status "Configuring PM2 startup..."
pm2 startup | tail -n 1 | bash

# Configure Nginx
print_status "Configuring Nginx reverse proxy..."
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

# Enable Nginx site
if [ "$DISTRO" = "debian" ]; then
    sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
else
    sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/conf.d/autojobr.conf
fi

# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw --force enable
elif command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-service=ssh
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

print_status "🎉 AutoJobr deployment completed successfully!"
echo ""
echo "=============================================="
echo "🚀 DEPLOYMENT SUMMARY"
echo "=============================================="
echo "✅ Node.js 20 installed"
echo "✅ PostgreSQL database configured with proper permissions"
echo "✅ Application built and started with PM2"
echo "✅ Nginx reverse proxy configured"
echo "✅ Firewall configured"
echo ""
echo "🌐 Application URL: http://$SERVER_IP"
echo ""
echo "⚠️  IMPORTANT: You need to configure API keys!"
echo "Edit .env file and add your API keys:"
echo "   - GROQ_API_KEY (get from console.groq.com)"
echo "   - RESEND_API_KEY (get from resend.com)"
echo ""
echo "Then restart the application:"
echo "   cd autojobr-main"
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
echo "Database Password: $DB_PASSWORD"
echo "=============================================="
echo ""
print_warning "Remember to:"
print_warning "1. Add your API keys to .env file:"
print_warning "   cd autojobr-main && nano .env"
print_warning "2. Configure your domain name in Nginx"
print_warning "3. Set up SSL certificate (Let's Encrypt)"
print_warning "4. Set up regular backups"
echo ""
print_status "Happy deploying! 🚀"