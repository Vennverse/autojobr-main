#!/bin/bash

echo "=== AutoJobr 502 Fix - Complete Solution ==="

# Navigate to the project directory
cd /home/ubuntu/autojobr-main || {
    echo "Error: Cannot find project directory"
    exit 1
}

# Stop all existing PM2 processes
echo "Stopping existing processes..."
pm2 stop all 2>/dev/null || echo "No processes to stop"
pm2 delete all 2>/dev/null || echo "No processes to delete"
pm2 kill 2>/dev/null || echo "PM2 daemon stopped"

# Kill any processes using port 5000
echo "Freeing port 5000..."
sudo pkill -f "server/index.ts" 2>/dev/null || echo "No server processes running"
sudo fuser -k 5000/tcp 2>/dev/null || echo "Port 5000 is free"

# Install dependencies (including the missing jsonwebtoken)
echo "Installing dependencies..."
npm install jsonwebtoken @types/jsonwebtoken tsx

# Verify .env file exists and has required variables
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

echo "Checking environment variables..."
grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|NODE_ENV" .env || echo "Warning: Some OAuth variables may be missing"

# Clean up problematic dist files
rm -rf dist 2>/dev/null || echo "No dist directory to remove"

# Create necessary directories
mkdir -p logs
mkdir -p uploads/resumes

# Test that npx tsx works
echo "Testing tsx via npx..."
npx tsx --version || {
    echo "ERROR: tsx not available via npx"
    exit 1
}

# Quick server startup test
echo "Testing server startup..."
timeout 3s bash -c 'NODE_ENV=production npx tsx server/index.ts' &
TEST_PID=$!
sleep 2
kill $TEST_PID 2>/dev/null || echo "Test process completed"

# Start application with PM2
echo "Starting AutoJobr with PM2..."
pm2 start ecosystem.config.cjs

# Wait for startup
sleep 5

# Check application status
echo "=== Application Status ==="
pm2 status

echo ""
echo "=== Recent Logs ==="
pm2 logs autojobr --lines 25

echo ""
echo "=== Testing Connectivity ==="
if curl -s http://localhost:5000/api/user >/dev/null 2>&1; then
    echo "✅ Application responding on port 5000"
    echo "🌐 Visit: https://autojobr.com"
else
    echo "⚠️  Application may not be responding on port 5000"
    echo "📋 Check logs: pm2 logs autojobr"
fi

echo ""
echo "=== Commands ==="
echo "📋 Monitor: pm2 logs autojobr"
echo "🔄 Restart: pm2 restart autojobr" 
echo "🛑 Stop: pm2 stop autojobr"

# Save PM2 configuration for auto-restart
pm2 save