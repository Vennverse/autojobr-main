#!/bin/bash

# Quick VM Environment Variables Update Script
# Usage: ./QUICK_VM_ENV_UPDATE.sh

echo "🔧 AutoJobr VM Environment Update Script"
echo "========================================"

# Get current directory
APP_DIR=$(pwd)
echo "📁 Working in directory: $APP_DIR"

# Create backup of existing .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created for existing .env file"
fi

# Create or update .env file
echo "📝 Creating/updating .env file..."

cat > .env << 'EOL'
# PayPal Configuration (REQUIRED FOR PAYMENTS)
PAYPAL_CLIENT_ID=your_production_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_production_paypal_client_secret_here

# Database Configuration
DATABASE_URL=your_database_connection_string_here

# Application Configuration
NODE_ENV=production
PORT=5000

# Domain Configuration (update with your actual domain)
REPL_SLUG=autojobr
REPL_OWNER=your-username

# Optional: Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Optional: AI Services
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Email Services
RESEND_API_KEY=your_resend_api_key_here
EOL

echo "✅ .env file created successfully"

# Set proper permissions
chmod 600 .env
echo "🔒 File permissions set to 600 (owner read/write only)"

# Check if PM2 is installed and running
if command -v pm2 &> /dev/null; then
    echo "🔄 PM2 detected. Restarting application..."
    pm2 restart all
    echo "✅ PM2 applications restarted"
elif systemctl is-active --quiet autojobr; then
    echo "🔄 Systemd service detected. Restarting..."
    sudo systemctl restart autojobr
    echo "✅ Systemd service restarted"
else
    echo "⚠️  Please manually restart your application to load new environment variables"
    echo "   You can use: npm start or node server/index.js"
fi

echo ""
echo "📋 IMPORTANT: Please edit the .env file with your actual values:"
echo "   nano .env"
echo ""
echo "🔍 Required variables to update:"
echo "   - PAYPAL_CLIENT_ID"
echo "   - PAYPAL_CLIENT_SECRET"
echo "   - DATABASE_URL"
echo ""
echo "✅ Setup complete!"
EOL