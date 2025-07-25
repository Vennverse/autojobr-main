#!/bin/bash

echo "🔍 Debugging AutoJobr application..."

cd ~/autojobr-main

# Check PM2 logs for errors
echo "📋 Checking PM2 logs..."
pm2 logs autojobr --lines 20

echo ""
echo "🔧 Checking environment variables..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    grep -v "SECRET\|PASSWORD\|KEY" .env | head -5
else
    echo "❌ .env file missing"
fi

echo ""
echo "📦 Checking if application was built..."
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    ls -la dist/
else
    echo "❌ dist directory missing - rebuilding..."
    npm run build
fi

echo ""
echo "🌐 Testing port availability..."
netstat -tlnp | grep :5000

echo ""
echo "🔄 Restarting application with fresh logs..."
pm2 delete autojobr 2>/dev/null || true
pm2 start ecosystem.config.cjs
sleep 3
pm2 logs autojobr --lines 10

echo ""
echo "🧪 Testing health endpoint..."
sleep 2
curl -v http://localhost:5000/api/health || echo "Connection failed"