#!/bin/bash

cd ~/autojobr-main

echo "🔧 Fixing environment variable loading..."

# Check current .env file
echo "📋 Current .env content:"
cat .env

# Update PM2 ecosystem config to load .env file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
EOF

# Also create a startup script that loads environment variables
cat > start.sh << 'EOF'
#!/bin/bash
cd ~/autojobr-main
source .env
export $(cat .env | xargs)
pm2 start ecosystem.config.cjs
EOF

chmod +x start.sh

# Stop current PM2 process
pm2 delete autojobr

# Start with environment variables loaded
echo "🚀 Starting application with environment variables..."
source .env
export $(cat .env | grep -v '^#' | xargs)
pm2 start ecosystem.config.cjs

echo "✅ Application restarted with environment variables"
echo "📊 Checking status..."
sleep 3
pm2 status
pm2 logs autojobr --lines 5