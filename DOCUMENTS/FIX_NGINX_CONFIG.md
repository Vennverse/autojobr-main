# Fix Nginx Configuration Error

## Problem
The current Nginx configuration has an invalid value "must-revalidate" in the gzip_proxied directive.

## Solution
Run these commands to fix the Nginx configuration:

```bash
# Remove the current faulty configuration
sudo rm -f /etc/nginx/sites-enabled/autojobr
sudo rm -f /etc/nginx/sites-available/autojobr

# Create corrected Nginx configuration for autojobr.com
sudo tee /etc/nginx/sites-available/autojobr << 'EOF'
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
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

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
    }

    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test the configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

## Verification
After running the above commands, test your application:

```bash
# Test local access
curl -I http://localhost:5000

# Test through Nginx (once DNS is configured)
curl -I http://autojobr.com
```

## What Changed
- Removed "must-revalidate" from the gzip_proxied directive
- Used proper Nginx syntax with single quotes around EOF to prevent variable expansion
- Corrected all proxy headers to use proper Nginx variable syntax

This configuration will work correctly with Nginx and support your autojobr.com domain.