#!/bin/bash

echo "=== Production 502 Fix for autojobr.com ==="

# Ensure we're in the production directory
cd /home/ubuntu/autojobr-main || {
    echo "ERROR: Production directory not found at /home/ubuntu/autojobr-main"
    exit 1
}

# Check if we're running as the correct user
if [ "$USER" != "ubuntu" ]; then
    echo "WARNING: Should be running as ubuntu user"
fi

# Stop existing PM2 processes
echo "Stopping existing production processes..."
pm2 stop autojobr 2>/dev/null || echo "No autojobr process running"
pm2 delete autojobr 2>/dev/null || echo "No autojobr process to delete"

# Kill any hanging processes on port 5000
echo "Ensuring port 5000 is free..."
sudo pkill -f "server/index.ts" 2>/dev/null || echo "No server processes to kill"
sudo lsof -ti:5000 | xargs sudo kill -9 2>/dev/null || echo "Port 5000 is free"

# Install missing production dependencies
echo "Installing missing dependencies..."
npm install --production=false jsonwebtoken @types/jsonwebtoken tsx

# Verify critical production files exist
echo "Verifying production configuration..."
if [ ! -f .env ]; then
    echo "ERROR: .env file missing in production!"
    exit 1
fi

if [ ! -f ecosystem.config.cjs ]; then
    echo "ERROR: ecosystem.config.cjs missing!"
    exit 1
fi

# Check that Google OAuth credentials are properly set
echo "Checking OAuth credentials..."
if grep -q "GOOGLE_CLIENT_ID=" .env && grep -q "GOOGLE_CLIENT_SECRET=" .env; then
    echo "✓ Google OAuth credentials found in .env"
else
    echo "WARNING: Google OAuth credentials may be missing"
fi

# Ensure production directories exist
mkdir -p logs uploads/resumes

# Remove any development artifacts
rm -rf dist node_modules/.cache 2>/dev/null

# Test tsx availability
if ! npx tsx --version >/dev/null 2>&1; then
    echo "ERROR: tsx not available via npx"
    echo "Running: npm install tsx"
    npm install tsx
fi

# Start the production application
echo "Starting production AutoJobr application..."
NODE_ENV=production pm2 start ecosystem.config.cjs

# Wait for application to initialize
echo "Waiting for application startup..."
sleep 8

# Check PM2 status
echo "=== PM2 Status ==="
pm2 status

# Test production connectivity
echo "=== Testing Production Connectivity ==="
if curl -s --connect-timeout 5 http://localhost:5000/api/user >/dev/null 2>&1; then
    echo "✅ Application responding on localhost:5000"
    echo "✅ Production site should be available at: https://autojobr.com"
else
    echo "❌ Application not responding on port 5000"
    echo "Checking recent logs..."
    pm2 logs autojobr --lines 15
fi

# Test external connectivity through nginx
echo "=== Testing Nginx Proxy ==="
if curl -s --connect-timeout 5 -I https://autojobr.com >/dev/null 2>&1; then
    echo "✅ External site responding via HTTPS"
else
    echo "❌ External site not responding - check nginx configuration"
fi

echo ""
echo "=== Production Commands ==="
echo "Monitor logs: pm2 logs autojobr"
echo "Restart app: pm2 restart autojobr"
echo "App status: pm2 status"
echo "Nginx status: sudo systemctl status nginx"
echo "Nginx reload: sudo systemctl reload nginx"

# Save PM2 configuration for auto-restart on reboot
pm2 save
pm2 startup | grep "sudo" | bash 2>/dev/null || echo "PM2 startup already configured"

echo "=== Production Fix Complete ==="