#!/bin/bash

echo "=== Fixing AutoJobr VM Signup Issues ==="

cd /home/ubuntu/autojobr-main

echo "1. Checking current environment variables..."
cat .env

echo -e "\n2. Updating environment with proper email configuration..."
cat > .env << 'EOF'
DATABASE_URL="postgresql://autojobr_user:autojobr123@localhost:5432/autojobr"
SESSION_SECRET="supersecretkey123456789"
NODE_ENV="production"
PORT="5000"
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"
# Disable WebSocket for email service
RESEND_WEBSOCKET_ENABLED="false"
# Use HTTP instead of HTTPS for local email service
EMAIL_SERVICE_URL="http://localhost"
EOF

echo -e "\n3. Updating PM2 ecosystem config with new environment..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://autojobr_user:autojobr123@localhost:5432/autojobr',
      SESSION_SECRET: 'supersecretkey123456789',
      GROQ_API_KEY: 'your_groq_api_key_here',
      RESEND_API_KEY: 'your_resend_api_key_here',
      RESEND_WEBSOCKET_ENABLED: 'false',
      EMAIL_SERVICE_URL: 'http://localhost'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
EOF

echo -e "\n4. Restarting PM2 with new configuration..."
pm2 stop autojobr
pm2 delete autojobr
pm2 start ecosystem.config.cjs
pm2 save

echo -e "\n5. Testing signup endpoint after fix..."
sleep 3
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User","userType":"job_seeker"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n6. Testing signin with demo user..."
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo.alexandra.chen@example.com","password":"demo123"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n7. Checking PM2 logs for any remaining errors..."
pm2 logs autojobr --lines 10

echo -e "\n=== Fix Complete ==="
echo "If you still see errors, run: pm2 logs autojobr --lines 20"