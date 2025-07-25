#!/bin/bash

cd ~/autojobr-main

# Fix PM2 configuration for ES modules
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
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

# Create logs directory
mkdir -p logs

# Start with PM2 using the .cjs file
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

echo "🚀 Application started successfully!"
echo "🌐 Access at: http://40.160.50.128"
echo ""
echo "⚠️ Now add your API keys:"
echo "   nano .env"
echo "   (Add GROQ_API_KEY and RESEND_API_KEY)"
echo "   pm2 restart autojobr"