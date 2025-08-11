#!/bin/bash

echo "Fixing 502 Bad Gateway - Missing Dependencies"

# Stop all PM2 processes
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null

# Install missing dependencies that were causing module not found errors
npm install jsonwebtoken @types/jsonwebtoken

# Clean up any dist files to avoid confusion
rm -rf dist

# Test the server directly with tsx
echo "Testing server startup with tsx..."
timeout 5s NODE_ENV=production ./node_modules/.bin/tsx server/index.ts &
TEST_PID=$!
sleep 3
kill $TEST_PID 2>/dev/null

# Start with PM2 using the corrected configuration
echo "Starting with PM2..."
pm2 start ecosystem.config.cjs

# Show status and logs
pm2 status
pm2 logs autojobr --lines 20

echo "If still getting 502, check nginx configuration for port 5000 proxy"