#!/bin/bash

# AutoJobr Production Deployment Script
echo "Starting AutoJobr deployment..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing PM2 processes
echo "Stopping existing PM2 processes..."
pm2 stop autojobr 2>/dev/null || echo "No existing process to stop"
pm2 delete autojobr 2>/dev/null || echo "No existing process to delete"

# Install dependencies
echo "Installing dependencies..."
npm ci --production=false

# Build the frontend
echo "Building frontend..."
npm run build

# Verify tsx is available
echo "Verifying tsx installation..."
./node_modules/.bin/tsx --version

# Test server startup
echo "Testing server startup..."
timeout 10s ./node_modules/.bin/tsx server/index.ts &
SERVER_PID=$!
sleep 5

# Kill test process
kill $SERVER_PID 2>/dev/null || echo "Test process already stopped"

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Wait for startup
sleep 5

# Show status
echo "Application status:"
pm2 status

# Show logs for verification
echo "Recent logs:"
pm2 logs autojobr --lines 20

echo "Deployment completed!"
echo "Application should be running at https://autojobr.com"
echo "Monitor: pm2 logs autojobr"
echo "Restart: pm2 restart autojobr"
echo "Stop: pm2 stop autojobr"