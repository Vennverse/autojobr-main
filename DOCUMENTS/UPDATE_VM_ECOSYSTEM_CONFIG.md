# Update Ecosystem Config on VM

## Method 1: Direct Edit on VM

```bash
# SSH into your VM and navigate to the app directory
cd /var/www/autojobr/autojobr-main

# Edit the ecosystem configuration file
nano ecosystem.config.cjs

# Replace the env section with:
env: {
  NODE_ENV: 'production',
  PORT: 5000,
  DATABASE_URL: 'postgresql://autojobr_user:autojobr123@localhost:5432/autojobr',
  SESSION_SECRET: 'supersecretkey123456789',
  PRODUCTION_DOMAIN: 'https://autojobr.com',
  
  // AI Services
  GROQ_API_KEY: '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',
  
  // Payment Services
  STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
  STRIPE_PUBLISHABLE_KEY: 'your_stripe_publishable_key_here',
  PAYPAL_CLIENT_ID: 'AXSSrk5jbYkWs0Feb1nFQ-DeB6wcLNjerMynwzQ3zLFrk7pwbBjAwmg4d5Gd268xSIvSx6pUSOJQRBdR',
  PAYPAL_CLIENT_SECRET: 'EMLaBH5IxHzSStsrGYGd-026jDUftyxBpW5vyZosLNsMfwNg-XhMDLtBgBqZc03b3neqRpdb7DC2SdQL',
  
  // Email Service
  RESEND_API_KEY: 're_Tm6vhbwR_MZkjUNCnaeoZpgXQWFZqvwQg',
  
  // OAuth
  GOOGLE_CLIENT_ID: '886940582280-c77j4n2r4mjdss6k9sus58l0qbc1lrh3.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: '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'
},

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart PM2 to load new configuration
pm2 restart autojobr

# Verify the application is running with new config
pm2 logs autojobr --lines 20
```

## Method 2: Replace Entire File

```bash
# Create new ecosystem config with all API keys
cd /var/www/autojobr/autojobr-main

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
      PRODUCTION_DOMAIN: 'https://autojobr.com',
      
      // AI Services
      GROQ_API_KEY: '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',
      
      // Payment Services
      STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
      STRIPE_PUBLISHABLE_KEY: 'your_stripe_publishable_key_here',
      PAYPAL_CLIENT_ID: 'AXSSrk5jbYkWs0Feb1nFQ-DeB6wcLNjerMynwzQ3zLFrk7pwbBjAwmg4d5Gd268xSIvSx6pUSOJQRBdR',
      PAYPAL_CLIENT_SECRET: 'EMLaBH5IxHzSStsrGYGd-026jDUftyxBpW5vyZosLNsMfwNg-XhMDLtBgBqZc03b3neqRpdb7DC2SdQL',
      
      // Email Service
      RESEND_API_KEY: 're_Tm6vhbwR_MZkjUNCnaeoZpgXQWFZqvwQg',
      
      // OAuth
      GOOGLE_CLIENT_ID: '886940582280-c77j4n2r4mjdss6k9sus58l0qbc1lrh3.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: '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'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
EOF

# Restart PM2
pm2 restart autojobr
```

## Verification Commands

```bash
# Check if services are now active
pm2 logs autojobr | grep -E "(Groq|PayPal|Resend|Google)"

# Check application status
pm2 status

# Test HTTPS access
curl -I https://autojobr.com

# Check specific service initialization
pm2 logs autojobr --lines 50
```

## Expected Output After Restart

You should see these messages in the logs:
- "Groq Service initialized with 1 API key available"
- "PayPal client configured for production"
- "Resend email service initialized"
- "Google OAuth provider enabled"

## Troubleshooting

If services don't activate:
```bash
# Check for syntax errors
cat ecosystem.config.cjs

# Verify PM2 loaded the config
pm2 show autojobr

# Check environment variables
pm2 env autojobr
```

Run Method 2 (replace entire file) for the quickest update, then restart PM2 to activate all your API keys.