#!/bin/bash

echo "🔧 Fixing Nginx configuration and adding API keys..."

# Navigate to the project directory
cd ~/autojobr-main/autojobr-main

# Update .env with the provided API keys
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://autojobr_user:autojobr_secure_2025@localhost:5432/autojobr"

# Server Configuration
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="JgwZWTlyMcclfX5TW1EUYLHGGqR9i3YTW75eu0uPORsRy8t4UFdvlC8O2uxs0Lu"

# API Keys
GROQ_API_KEY="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"
RESEND_API_KEY="re_Tm6vhbwR_MZkjUNCnaeoZpgXQWFZqvwQg"

# Optional Payment Configuration
PAYPAL_CLIENT_ID="your_paypal_client_id_here"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret_here"

# Optional SMTP Configuration
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EOF

echo "✅ API keys added to .env file"

# Fix Nginx configuration
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

# Enable the site and remove default
sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Nginx configuration updated"

# Restart PM2 with new environment variables
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

echo "✅ Application restarted with API keys"

# Check status
echo ""
echo "=== Status Check ==="
pm2 status
echo ""
echo "Testing application..."
sleep 3
curl -s http://localhost:5000/api/health && echo " - Health check passed" || echo " - Health check failed"

echo ""
echo "🎉 Setup complete! Your application should now be available at http://40.160.50.128"