#!/bin/bash

echo "🔧 Fixing Nginx configuration for AutoJobr..."

# Create proper Nginx configuration for AutoJobr
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
}
EOF

# Remove default Nginx site and enable AutoJobr
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

echo "✅ Nginx configuration fixed!"
echo "🌐 Your AutoJobr app should now be accessible at http://40.160.50.128"

# Check if AutoJobr application is running
echo "📊 Checking application status..."
pm2 status

# Check if app is responding on port 5000
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ AutoJobr application is responding on port 5000"
else
    echo "❌ AutoJobr application is not responding on port 5000"
    echo "🔄 Attempting to start the application..."
    cd ~/autojobr-main
    pm2 start ecosystem.config.cjs
fi