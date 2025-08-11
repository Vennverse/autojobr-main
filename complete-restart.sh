#!/bin/bash

cd ~/autojobr-main

echo "🔧 Completing PM2 restart process..."

# Load environment variables properly
source .env
export NODE_ENV DATABASE_URL SESSION_SECRET GROQ_API_KEY RESEND_API_KEY PORT

# Check what variables are actually loaded
echo "📋 Environment variables loaded:"
echo "GROQ_API_KEY: ${GROQ_API_KEY:0:10}..."
echo "RESEND_API_KEY: ${RESEND_API_KEY:0:10}..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."

# Stop any existing PM2 processes
pm2 delete autojobr 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Create simple ecosystem file with variables
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || '5000',
      DATABASE_URL: process.env.DATABASE_URL,
      SESSION_SECRET: process.env.SESSION_SECRET,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
EOF

# Start PM2 with loaded environment
pm2 start ecosystem.config.cjs

echo "✅ PM2 restarted"
sleep 5

# Check status
pm2 status
echo ""
echo "📋 Latest logs:"
pm2 logs autojobr --lines 5

echo ""
echo "🧪 Testing connection:"
curl -s http://localhost:5000/api/health || echo "Still not responding"