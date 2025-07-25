#!/bin/bash

# Quick fix for deployment in progress
echo "🔧 Fixing AutoJobr deployment..."

# Navigate to home directory
cd ~

# Clone the repository if not present
if [ ! -d "autojobr-main" ]; then
    echo "📥 Cloning AutoJobr repository..."
    git clone https://github.com/Vennverse/autojobr-main.git
fi

# Navigate to the application directory
cd autojobr-main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 64)

# Create .env file
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://autojobr_user:$DB_PASSWORD@localhost:5432/autojobr"

# Server Configuration
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="$SESSION_SECRET"

# API Keys (YOU NEED TO SET THESE)
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"

# Optional Payment Configuration
PAYPAL_CLIENT_ID="your_paypal_client_id_here"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret_here"
EOF

# Set up database schema
echo "🗄️ Setting up database schema..."
npm run db:push

# Build application
echo "🔨 Building application..."
npm run build

# Create PM2 ecosystem file
echo "⚡ Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
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

# Start application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js
pm2 save

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ AutoJobr deployment completed!"
echo ""
echo "🌐 Access your application at: http://$SERVER_IP"
echo ""
echo "⚠️  IMPORTANT: Add your API keys to .env file:"
echo "   cd autojobr-main"
echo "   nano .env"
echo ""
echo "Then restart: pm2 restart autojobr"
echo ""
echo "✅ Deployment fixed successfully!"