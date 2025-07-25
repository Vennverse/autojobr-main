#!/bin/bash

cd ~/autojobr-main

echo "🔧 Fixing PM2 environment variable loading..."

# Read environment variables from .env file
eval $(cat .env | grep -v '^#' | sed 's/^/export /')

# Create a new PM2 ecosystem config that explicitly sets env vars
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    env: {
      NODE_ENV: '${NODE_ENV}',
      PORT: '${PORT}',
      DATABASE_URL: '${DATABASE_URL}',
      SESSION_SECRET: '${SESSION_SECRET}',
      GROQ_API_KEY: '${GROQ_API_KEY}',
      RESEND_API_KEY: '${RESEND_API_KEY}',
      PAYPAL_CLIENT_ID: '${PAYPAL_CLIENT_ID:-}',
      PAYPAL_CLIENT_SECRET: '${PAYPAL_CLIENT_SECRET:-}'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
EOF

# Stop and delete existing PM2 process
pm2 delete autojobr 2>/dev/null || true

# Start with the new configuration
pm2 start ecosystem.config.cjs

echo "✅ Application restarted with proper environment variables"
sleep 5

# Check status and logs
pm2 status
echo ""
echo "📋 Recent logs:"
pm2 logs autojobr --lines 10

echo ""
echo "🧪 Testing health endpoint:"
curl -s http://localhost:5000/api/health && echo "" || echo "Connection failed"