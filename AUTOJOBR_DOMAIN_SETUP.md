# AutoJobr Domain Setup for autojobr.com

## Current Status
Your AutoJobr application is successfully running on your VM. Now we'll configure it for your domain autojobr.com.

## Step 1: Point Domain to Your VM

1. **Get your VM's IP address:**
```bash
curl -4 icanhazip.com
```

2. **Configure DNS Records:**
   - Go to your domain registrar (where you bought autojobr.com)
   - Add these DNS records:
     - **A Record**: `@` → `[your-vm-ip]`
     - **CNAME Record**: `www` → `autojobr.com`

## Step 2: Update Nginx Configuration for Your Domain

```bash
# Update Nginx configuration for autojobr.com
sudo tee /etc/nginx/sites-available/autojobr << EOF
server {
    listen 80;
    server_name autojobr.com www.autojobr.com;

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
    }

    client_max_body_size 50M;
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Step 3: Test Domain Access

```bash
# Test your domain (after DNS propagation)
curl -I http://autojobr.com
curl -I http://www.autojobr.com

# Check if both redirect properly
ping autojobr.com
ping www.autojobr.com
```

## Step 4: Install SSL Certificate (HTTPS)

```bash
# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate for your domain
sudo certbot --nginx -d autojobr.com -d www.autojobr.com

# Test SSL renewal
sudo certbot renew --dry-run
```

After SSL installation, your site will be available at:
- ✅ https://autojobr.com
- ✅ https://www.autojobr.com

## Step 5: Update Application Configuration

Update your ecosystem.config.cjs to include domain-specific settings:

```bash
# Edit PM2 configuration
nano ecosystem.config.cjs
```

Add these environment variables to the `env_production` section:
```javascript
env_production: {
  // ... existing variables ...
  DOMAIN: 'autojobr.com',
  ALLOWED_ORIGINS: 'https://autojobr.com,https://www.autojobr.com,http://autojobr.com,http://www.autojobr.com',
  CORS_ORIGIN: 'https://autojobr.com'
}
```

Restart the application:
```bash
pm2 restart autojobr
```

## Step 6: Verify Everything Works

1. **Check application status:**
```bash
pm2 status
sudo systemctl status nginx
```

2. **Test all URLs:**
   - http://autojobr.com (should redirect to HTTPS)
   - https://autojobr.com (main site)
   - https://www.autojobr.com (should work)

3. **Test key features:**
   - Job browsing
   - User registration/login
   - Resume upload
   - Job applications

## DNS Propagation

DNS changes can take 24-48 hours to propagate globally. You can check propagation status at:
- https://www.whatsmydns.net/
- Enter "autojobr.com" and check A records

## Troubleshooting

### Domain not resolving:
```bash
# Check DNS
nslookup autojobr.com
dig autojobr.com

# Check if Nginx is listening
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### SSL certificate issues:
```bash
# Check certificate status
sudo certbot certificates

# Force renewal if needed
sudo certbot renew --force-renewal
```

### Application not loading:
```bash
# Check application logs
pm2 logs autojobr

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Final Result

Once complete, your AutoJobr platform will be live at:
🌐 **https://autojobr.com** - Your production job application platform

Features available:
- ✅ Job posting and browsing
- ✅ Resume upload and analysis
- ✅ User authentication
- ✅ Virtual interviews (with API keys)
- ✅ Payment processing (with API keys)
- ✅ Real-time messaging
- ✅ Mobile-responsive design
- ✅ SEO optimization