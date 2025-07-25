#!/bin/bash

# Commands to run on your VM to fix Nginx configuration

echo "=== Checking Application Status ==="
pm2 status
pm2 logs autojobr --lines 5

echo -e "\n=== Testing if app is running on port 5000 ==="
curl -I http://localhost:5000 || echo "App not responding on port 5000"

echo -e "\n=== Fixing Nginx Configuration ==="
# Remove default Nginx site and create proper AutoJobr config
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/autojobr

# Create the correct Nginx configuration
sudo tee /etc/nginx/sites-available/autojobr > /dev/null << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 10M;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/autojobr

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo -e "\n=== Testing the fixed configuration ==="
sleep 2
curl -I http://localhost || echo "Still not working"

echo -e "\n=== If app still not working, restart everything ==="
echo "Run these commands:"
echo "pm2 restart autojobr"
echo "sudo systemctl restart nginx"
echo "curl -I http://localhost"

