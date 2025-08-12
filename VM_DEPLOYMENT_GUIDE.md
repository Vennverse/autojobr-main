# AutoJobr VM Deployment Guide

## Prerequisites
- Fresh Ubuntu 20.04+ or CentOS 7+ VM
- Root or sudo access
- At least 2GB RAM, 20GB storage
- Internet connectivity

## Step 1: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential software-properties-common
```

## Step 2: Install Node.js 20

```bash
# Install Node.js 20 using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE autojobr;
CREATE USER autojobr_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
ALTER USER autojobr_user CREATEDB;
\q
EOF
```

## Step 4: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

## Step 5: Install Nginx (Web Server)

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Allow HTTP and HTTPS through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable
```

## Step 6: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/autojobr
sudo chown $USER:$USER /var/www/autojobr
cd /var/www/autojobr

# Clone your repository (replace with your actual repo URL)
git clone <YOUR_REPOSITORY_URL> .
# Note: If repository is downloaded as autojobr-main folder, move into it:
cd autojobr-main

# Install dependencies (including missing ones)
npm install
npm install jsonwebtoken
npm install @types/jsonwebtoken --save-dev
npm install dotenv

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://autojobr_user:secure_password_123@localhost:5432/autojobr

# Add your API keys here
GROQ_API_KEY=your_groq_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
RESEND_API_KEY=your_resend_api_key_here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Session secret
SESSION_SECRET=your_very_long_random_session_secret_here
EOF

# Set proper permissions
chmod 600 .env
```

## Step 7: Build and Deploy Database

```bash
# Push database schema
npm run db:push

# Build the application
npm run build
```

## Step 8: Configure PM2

```bash
# Create PM2 ecosystem file (use .cjs for CommonJS module)
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'autojobr',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://autojobr_user:secure_password_123@localhost:5432/autojobr',
      SESSION_SECRET: '$(openssl rand -base64 32)',
      
      // AI Services
      GROQ_API_KEY: 'your_groq_api_key_here',
      
      // Payment Services
      STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
      STRIPE_PUBLISHABLE_KEY: 'your_stripe_publishable_key_here',
      PAYPAL_CLIENT_ID: 'your_paypal_client_id_here',
      PAYPAL_CLIENT_SECRET: 'your_paypal_client_secret_here',
      
      // Email Service
      RESEND_API_KEY: 'your_resend_api_key_here',
      
      // OAuth (optional)
      GOOGLE_CLIENT_ID: 'your_google_client_id_here',
      GOOGLE_CLIENT_SECRET: 'your_google_client_secret_here'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
```

## Step 9: Configure Nginx

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/autojobr << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    location / {
        proxy_pass http://localhost:5000;
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

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File upload size
    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Step 10: SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup auto-renewal
sudo systemctl enable snap.certbot.renew.timer
```

## Step 11: Monitoring and Logs

```bash
# Install monitoring tools
sudo npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Set up log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# View application logs
pm2 logs autojobr
pm2 monit
```

## Step 12: Backup Script

```bash
# Create backup script
cat > /var/www/autojobr/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/autojobr"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U autojobr_user -d autojobr > $BACKUP_DIR/database_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_files_$DATE.tar.gz /var/www/autojobr --exclude=node_modules --exclude=logs

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make backup script executable
chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /var/www/autojobr/backup.sh" | sudo crontab -
```

## Step 13: Security Hardening

```bash
# Update system packages regularly
sudo apt install -y unattended-upgrades

# Configure fail2ban for SSH protection
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Disable root login and password authentication (after setting up SSH keys)
# sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# sudo systemctl restart ssh
```

## Step 14: Final Checks

```bash
# Check if all services are running
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Check if application is accessible
curl -I http://localhost:5000
curl -I http://your-domain.com

# Check logs for any errors
pm2 logs autojobr --lines 50
sudo journalctl -u nginx -f
```

## Step 15: API Keys Configuration

After deployment, you'll need to configure the API keys in the `.env` file:

1. **GROQ API Key**: Get from [console.groq.com](https://console.groq.com)
2. **Stripe Keys**: Get from [dashboard.stripe.com](https://dashboard.stripe.com)
3. **PayPal Keys**: Get from [developer.paypal.com](https://developer.paypal.com)
4. **Resend API Key**: Get from [resend.com](https://resend.com)
5. **Google OAuth**: Get from [console.developers.google.com](https://console.developers.google.com)

Update the `.env` file and restart the application:
```bash
pm2 restart autojobr
```

## Maintenance Commands

```bash
# View application status
pm2 status
pm2 monit

# View logs
pm2 logs autojobr
pm2 logs autojobr --lines 100

# Restart application
pm2 restart autojobr

# Update application
cd /var/www/autojobr
git pull
npm install
npm run build
npm run db:push
pm2 restart autojobr

# View system resources
htop
df -h
free -h
```

## Troubleshooting

### Common Issues:

1. **Application won't start**: Check logs with `pm2 logs autojobr`
2. **Database connection failed**: Verify PostgreSQL is running and credentials are correct
3. **502 Bad Gateway**: Check if application is running on port 5000
4. **Permission denied**: Ensure proper file permissions and ownership

### Quick Fixes:

```bash
# Restart all services
sudo systemctl restart nginx
sudo systemctl restart postgresql
pm2 restart all

# Check port usage
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80

# Check disk space
df -h
du -sh /var/www/autojobr/*
```

This guide provides a complete setup for deploying AutoJobr on a fresh VM with production-ready configuration, security, monitoring, and backup systems.