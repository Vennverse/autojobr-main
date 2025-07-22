#!/bin/bash

# AutoJobr Linux VM Deployment Script
# Usage: ./deploy.sh [domain]

set -e

DOMAIN=${1:-"yourdomain.com"}
APP_DIR="/var/www/autojobr"
NGINX_SITE="/etc/nginx/sites-available/autojobr"
DB_NAME="autojobr"
DB_USER="autojobr_user"

echo "🚀 Starting AutoJobr deployment for domain: $DOMAIN"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
if ! command_exists node || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PostgreSQL
if ! command_exists psql; then
    echo "📦 Installing PostgreSQL..."
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Install Nginx
if ! command_exists nginx; then
    echo "📦 Installing Nginx..."
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Install PM2
if ! command_exists pm2; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p $APP_DIR/logs
sudo chown -R $USER:$USER $APP_DIR

# Database setup
echo "🗄️  Setting up database..."
DB_PASSWORD=$(openssl rand -base64 32)

# Create database and user (only if they don't exist)
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
sudo -u postgres createdb $DB_NAME

sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > $APP_DIR/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGDATABASE=$DB_NAME
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD

# Application Configuration
NODE_ENV=production
PORT=5000

# Domain Configuration
PRODUCTION_DOMAIN=https://$DOMAIN

# API Keys (you need to add these manually)
GROQ_API_KEY=your_groq_api_key_here
RESEND_API_KEY=your_resend_api_key_here

# OAuth Authentication (Social Login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key

# Optional: Payment Integration
# STRIPE_SECRET_KEY=your_stripe_key_here
# PAYPAL_CLIENT_ID=your_paypal_client_id_here
# PAYPAL_CLIENT_SECRET=your_paypal_secret_here
EOF

chmod 600 $APP_DIR/.env

# Install dependencies and build
echo "📦 Installing application dependencies..."
cd $APP_DIR
npm install

echo "🔨 Building application..."
npm run build

# Push database schema
echo "🗄️  Migrating database schema..."
npm run db:push

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Create Nginx configuration
echo "🌐 Configuring Nginx..."
sudo tee $NGINX_SITE > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:5000;
    }
}
EOF

# Enable site and test configuration
sudo ln -sf $NGINX_SITE /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create backup script
echo "💾 Setting up backup script..."
cat > /home/$USER/backup_autojobr.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
mkdir -p $BACKUP_DIR

# Database backup
export PGPASSWORD="$PGPASSWORD"
pg_dump -h localhost -U $PGUSER -d $PGDATABASE > $BACKUP_DIR/autojobr_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "autojobr_*.sql" -mtime +7 -delete

echo "Backup completed: autojobr_$DATE.sql"
EOF

chmod +x /home/$USER/backup_autojobr.sh

# Add backup to cron (if not already added)
if ! crontab -l 2>/dev/null | grep -q "backup_autojobr.sh"; then
    (crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup_autojobr.sh") | crontab -
fi

# Install SSL certificate if domain is not localhost
if [[ "$DOMAIN" != "localhost" && "$DOMAIN" != "yourdomain.com" ]]; then
    echo "🔒 Installing SSL certificate..."
    sudo snap install core; sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
    echo "Running Certbot for SSL certificate..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Add auto-renewal to cron
    if ! sudo crontab -l 2>/dev/null | grep -q "certbot renew"; then
        (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    fi
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update API keys in $APP_DIR/.env"
echo "   - GROQ_API_KEY (get from https://console.groq.com/)"
echo "   - RESEND_API_KEY (get from https://resend.com/)"
echo ""
echo "2. Configure OAuth for social login (optional):"
echo "   - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET (Google Cloud Console)"
echo "   - GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET (GitHub Developer Settings)"
echo "   - LINKEDIN_CLIENT_ID & LINKEDIN_CLIENT_SECRET (LinkedIn Developer Portal)"
echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "   See OAUTH_SETUP_GUIDE.md for detailed instructions"
echo ""
echo "3. Restart the application after updating keys:"
echo "   pm2 restart autojobr"
echo ""
echo "3. Your application should be accessible at:"
if [[ "$DOMAIN" != "localhost" && "$DOMAIN" != "yourdomain.com" ]]; then
    echo "   https://$DOMAIN"
else
    echo "   http://$DOMAIN (configure SSL manually for production)"
fi
echo ""
echo "📊 Monitoring commands:"
echo "   pm2 status       # Check application status"
echo "   pm2 logs autojobr # View application logs"
echo "   pm2 monit        # Real-time monitoring"
echo ""
echo "Database credentials saved to: $APP_DIR/.env"
echo "Backup script created at: /home/$USER/backup_autojobr.sh"