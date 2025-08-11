#!/bin/bash

echo "🔧 AutoJobr VM Deployment (502 Fix)"

# Ensure we're in the right directory
cd /home/ubuntu/autojobr-main

# Create necessary directories
mkdir -p logs
mkdir -p uploads/resumes
mkdir -p dist

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "📦 Installing/updating dependencies..."
npm install tsx --save-dev
npm ci --production=false

# Kill any existing processes on port 5000
echo "🔄 Stopping any processes on port 5000..."
sudo pkill -f "server/index.ts" || echo "No processes to kill"
sudo fuser -k 5000/tcp 2>/dev/null || echo "Port 5000 is free"

# Stop and remove existing PM2 processes
echo "🛑 Cleaning up PM2 processes..."
pm2 stop all 2>/dev/null || echo "No PM2 processes to stop"
pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
pm2 kill 2>/dev/null || echo "PM2 daemon not running"

# Test that tsx works
echo "🧪 Testing tsx installation..."
./node_modules/.bin/tsx --version
if [ $? -ne 0 ]; then
    echo "❌ tsx installation failed!"
    exit 1
fi

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Test server startup (quick test)
echo "🧪 Testing server startup..."
timeout 5s NODE_ENV=production ./node_modules/.bin/tsx server/index.ts &
TEST_PID=$!
sleep 3
kill $TEST_PID 2>/dev/null || echo "Test completed"

# Start PM2 daemon
echo "🚀 Starting PM2 daemon..."
pm2 startup
pm2 start ecosystem.config.cjs

# Wait for application to start
echo "⏳ Waiting for application startup..."
sleep 10

# Check if the application is running
echo "🔍 Checking application status..."
pm2 status
pm2 logs autojobr --lines 30

# Test if port 5000 is responding
echo "🌐 Testing port 5000 connectivity..."
curl -s http://localhost:5000/api/user > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Application is responding on port 5000"
else
    echo "⚠️  Application might not be responding on port 5000"
fi

# Save PM2 configuration
pm2 save

echo ""
echo "🎉 Deployment completed!"
echo "📋 Monitor logs: pm2 logs autojobr"
echo "🔄 Restart app: pm2 restart autojobr"
echo "🛑 Stop app: pm2 stop autojobr"
echo "🌐 Check website: https://autojobr.com"