# Fix Google OAuth Error - Placeholder Client ID Issue

## Problem Analysis
The Google OAuth is failing because the application is using placeholder values instead of real Google Client ID. The error URL shows:
```
client_id=your_google_client_id_here
```

## Root Cause
Your VM's ecosystem.config.cjs still contains placeholder values instead of the actual Google OAuth credentials.

## Solution: Update Ecosystem Config on VM

### Step 1: SSH into your VM and update the config
```bash
cd /var/www/autojobr/autojobr-main

# Replace the ecosystem config with corrected values
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
      PAYPAL_CLIENT_ID: 'AXSSrk5jbYkWs0Feb1nFQ-DeB6wcLNjerMynwzQ3zLFrk7pwbBjAwmg4d5Gd268xSIvSx6pUSOJQRBdR',
      PAYPAL_CLIENT_SECRET: 'EMLaBH5IxHzSStsrGYGd-026jDUftyxBpW5vyZosLNsMfwNg-XhMDLtBgBqZc03b3neqRpdb7DC2SdQL',
      
      // Email Service
      RESEND_API_KEY: 're_Tm6vhbwR_MZkjUNCnaeoZpgXQWFZqvwQg',
      
      // OAuth (CORRECTED VALUES)
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
```

### Step 2: Restart PM2 to load new configuration
```bash
pm2 restart autojobr
```

### Step 3: Verify Google OAuth is now working
```bash
# Check if Google OAuth provider is enabled
pm2 logs autojobr | grep -i "google\|oauth"

# Test OAuth URL generation
curl -s "https://autojobr.com/api/auth/providers" | grep -i google
```

## Expected Results After Fix

1. **Google OAuth URL should show real client ID:**
   ```
   client_id=886940582280-c77j4n2r4mjdss6k9sus58l0qbc1lrh3.apps.googleusercontent.com
   ```

2. **PM2 logs should show:**
   ```
   Google OAuth provider enabled
   Google client ID configured: 886940582280-c77j4n2r4mjdss6k9sus58l0qbc1lrh3.apps.googleusercontent.com
   ```

3. **Google Sign-in button should work properly** on https://autojobr.com

## Verification Steps

After updating and restarting:

1. **Test OAuth providers endpoint:**
   ```bash
   curl https://autojobr.com/api/auth/providers
   ```
   Should return: `{"providers":{"google":true,...}}`

2. **Test Google OAuth initiation:**
   Visit https://autojobr.com and click "Sign in with Google"

3. **Check for errors:**
   ```bash
   pm2 logs autojobr --lines 50 | grep -i error
   ```

## Notes
- The Google OAuth credentials are already properly configured for autojobr.com domain
- After this fix, users will be able to sign in with Google successfully
- All other API services (Groq AI, PayPal, Resend email) remain active

## Troubleshooting
If Google OAuth still doesn't work after the fix:
1. Verify the ecosystem.config.cjs was updated correctly
2. Check PM2 restart was successful: `pm2 status`
3. Review application logs: `pm2 logs autojobr --lines 100`