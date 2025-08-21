# SSL Setup for autojobr.com

## Prerequisites
- Domain autojobr.com must be pointing to your VM IP
- Nginx must be running and configured
- Port 80 and 443 must be open

## Step 1: Install Certbot

```bash
# Update system packages
sudo apt update

# Install Certbot and Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
```

## Step 2: Configure Firewall

```bash
# Allow HTTPS traffic
sudo ufw allow 'Nginx Full'
sudo ufw allow 443/tcp
sudo ufw status
```

## Step 3: Fix Current Nginx Configuration

```bash
# Remove any faulty configurations
sudo rm -f /etc/nginx/sites-enabled/autojobr
sudo rm -f /etc/nginx/sites-available/autojobr

# Create corrected Nginx configuration
sudo tee /etc/nginx/sites-available/autojobr << 'EOF'
server {
    listen 80;
    server_name autojobr.com www.autojobr.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

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
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 4: Obtain SSL Certificate

```bash
# Get SSL certificate for both domains
sudo certbot --nginx -d autojobr.com -d www.autojobr.com

# Follow the prompts:
# 1. Enter email address for urgent renewal and security notices
# 2. Agree to terms of service (A)
# 3. Choose whether to share email with EFF (Y/N)
# 4. Choose redirect option (recommended: 2 - Redirect HTTP to HTTPS)
```

## Step 5: Verify SSL Installation

```bash
# Test SSL certificate
sudo certbot certificates

# Check Nginx configuration
sudo nginx -t

# Restart Nginx to ensure all changes are applied
sudo systemctl restart nginx

# Check SSL status
curl -I https://autojobr.com
curl -I https://www.autojobr.com
```

## Step 6: Setup Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer

# Enable auto-renewal if not already enabled
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Step 7: Update Application Configuration

```bash
# Update PM2 configuration to use HTTPS domain
cd /var/www/autojobr/autojobr-main
nano ecosystem.config.cjs
```

Update the PRODUCTION_DOMAIN to use HTTPS:
```javascript
PRODUCTION_DOMAIN: 'https://autojobr.com',
```

Restart the application:
```bash
pm2 restart autojobr
```

## Step 8: Enhanced Security Headers (Optional)

```bash
# Add additional security headers
sudo tee /etc/nginx/sites-available/autojobr << 'EOF'
server {
    listen 80;
    server_name autojobr.com www.autojobr.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name autojobr.com www.autojobr.com;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/autojobr.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autojobr.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Enhanced security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

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
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;
}
EOF

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Verification Commands

```bash
# Check certificate status
sudo certbot certificates

# Test HTTPS
curl -I https://autojobr.com
curl -I https://www.autojobr.com

# Test HTTP redirect
curl -I http://autojobr.com

# Check SSL rating (external)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=autojobr.com

# Check application status
pm2 status
sudo systemctl status nginx
```

## Troubleshooting

### Certificate not issued:
```bash
# Check DNS propagation
nslookup autojobr.com
dig autojobr.com

# Check if domain points to your server
curl -I http://autojobr.com
```

### Nginx errors:
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t
```

### Certificate renewal issues:
```bash
# Force renewal
sudo certbot renew --force-renewal

# Check renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Final Result

After completing these steps, your AutoJobr platform will be:
- ✅ Accessible at https://autojobr.com
- ✅ Automatically redirect HTTP to HTTPS
- ✅ Protected with SSL/TLS encryption
- ✅ Rated A+ on SSL Labs
- ✅ Auto-renewing certificates
- ✅ Enhanced security headers
- ✅ Production-ready configuration