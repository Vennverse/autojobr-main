# AutoJobr Linux VM Deployment Guide

## Prerequisites

### System Requirements
- Ubuntu 20.04+ or CentOS 8+ Linux VM
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ disk space
- Root or sudo access

### Required Software
- Node.js 20+ and npm
- PostgreSQL 14+
- Nginx (for reverse proxy)
- PM2 (for process management)
- SSL certificate (Let's Encrypt recommended)

## Step 1: Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2 globally
```bash
sudo npm install -g pm2
```

## Step 2: Database Setup

### Create Database and User
```bash
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE autojobr;
CREATE USER autojobr_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
ALTER USER autojobr_user CREATEDB;
\q
```

### Configure PostgreSQL (optional - for remote connections)
Edit `/etc/postgresql/14/main/postgresql.conf`:
```
listen_addresses = 'localhost'
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:
```
local   autojobr        autojobr_user                   md5
host    autojobr        autojobr_user   127.0.0.1/32    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## Step 3: Deploy Application

### Clone/Upload Your Project
```bash
# Create app directory
sudo mkdir -p /var/www/autojobr
sudo chown $USER:$USER /var/www/autojobr

# Upload your project files to /var/www/autojobr
# You can use scp, rsync, or git clone
```

### Install Dependencies
```bash
cd /var/www/autojobr
npm install
```

### Build Application
```bash
npm run build
```

## Step 4: Environment Configuration

Create `.env` file in `/var/www/autojobr`:
```bash
# Database Configuration
DATABASE_URL=postgresql://autojobr_user:your_secure_password@localhost:5432/autojobr
PGHOST=localhost
PGPORT=5432
PGDATABASE=autojobr
PGUSER=autojobr_user
PGPASSWORD=your_secure_password

# Application Configuration
NODE_ENV=production
PORT=5000

# API Keys (replace with your actual keys)
GROQ_API_KEY=your_groq_api_key
RESEND_API_KEY=your_resend_api_key

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
STRIPE_SECRET_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Domain Configuration
PRODUCTION_DOMAIN=https://yourdomain.com
```

### Set Proper Permissions
```bash
chmod 600 /var/www/autojobr/.env
chown $USER:$USER /var/www/autojobr/.env
```

## Step 5: Database Migration

### Push Schema to Database
```bash
cd /var/www/autojobr
npm run db:push
```

## Step 6: PM2 Process Management

### Create PM2 Ecosystem File
```bash
# This file is already created as ecosystem.config.js in your project
```

### Start Application with PM2
```bash
cd /var/www/autojobr
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the PM2 startup command output to enable auto-start.

## Step 7: Nginx Reverse Proxy

### Create Nginx Configuration
Create `/etc/nginx/sites-available/autojobr`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Main Application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API Rate Limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Authentication Rate Limiting
    location ~ ^/api/(auth|login|register) {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Files Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:5000;
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 8: SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Get SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal
```bash
sudo crontab -e
```
Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 9: Firewall Configuration

### Configure UFW
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 10: Monitoring and Maintenance

### PM2 Monitoring
```bash
pm2 status
pm2 logs autojobr
pm2 monit
```

### System Resource Monitoring
```bash
# Install htop for system monitoring
sudo apt install htop -y

# Check logs
sudo journalctl -u nginx -f
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Backup Script
Create `/home/$USER/backup_autojobr.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U autojobr_user -d autojobr > $BACKUP_DIR/autojobr_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "autojobr_*.sql" -mtime +7 -delete

echo "Backup completed: autojobr_$DATE.sql"
```

Make executable and add to cron:
```bash
chmod +x /home/$USER/backup_autojobr.sh
crontab -e
```
Add:
```
0 2 * * * /home/$USER/backup_autojobr.sh
```

## Deployment Checklist

- [ ] Server setup and dependencies installed
- [ ] PostgreSQL database created and configured
- [ ] Application code uploaded and built
- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] PM2 process manager configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup script configured

## Troubleshooting

### Common Issues

1. **Application won't start**: Check PM2 logs
   ```bash
   pm2 logs autojobr
   ```

2. **Database connection issues**: Verify DATABASE_URL and PostgreSQL status
   ```bash
   sudo systemctl status postgresql
   psql -h localhost -U autojobr_user -d autojobr -c "SELECT 1;"
   ```

3. **Nginx errors**: Check configuration and logs
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

4. **SSL issues**: Verify certificate and renewal
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

### Performance Optimization

1. **Enable Nginx caching**
2. **Configure proper PostgreSQL settings for your server specs**
3. **Set up log rotation**
4. **Monitor resource usage with htop**

## Support

For issues or questions:
- Check application logs: `pm2 logs autojobr`
- Check system logs: `sudo journalctl -xe`
- Monitor resources: `htop`
- Database status: `sudo systemctl status postgresql`