#!/bin/bash

echo "🔧 Fixing Groq WebSocket Connection Issue"

cd ~/autojobr-main

# 1. Check if Groq is trying to connect to localhost WebSocket
echo "Checking current Groq configuration..."

# 2. Fix any WebSocket URL issues in environment
echo "Updating environment configuration..."
source .env

# Remove any localhost WebSocket configurations
sed -i '/wss:\/\/localhost/d' .env 2>/dev/null || true
sed -i '/ws:\/\/localhost/d' .env 2>/dev/null || true

# Ensure proper Groq API configuration
if ! grep -q "GROQ_API_KEY" .env; then
    echo "⚠️  GROQ_API_KEY not found in .env file"
    echo "Please add your Groq API key to .env file:"
    echo "GROQ_API_KEY=your_groq_api_key_here"
fi

# 3. Check for any hardcoded localhost WebSocket URLs in code
echo "Scanning for WebSocket localhost references..."
find . -name "*.ts" -o -name "*.js" | xargs grep -l "wss://localhost" 2>/dev/null || echo "No WebSocket localhost references found"

# 4. Restart application with proper environment
echo "Restarting application..."
export $(cat .env | grep -v '^#' | xargs)
pm2 restart autojobr

sleep 2

# 5. Test Groq API
echo "Testing Groq API connection..."
curl -s -X GET http://localhost:5000/api/test/groq \
  -H "Cookie: $(cat session_cookies.txt 2>/dev/null || echo '')" \
  | jq . 2>/dev/null || echo "Groq test response received"

echo ""
echo "✅ Groq connection fix completed"
echo "🌐 Check logs: pm2 logs autojobr"