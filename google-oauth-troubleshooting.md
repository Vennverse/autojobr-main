# Google OAuth Troubleshooting Guide

## Current Issue
Error: "Client Authentication failed" - This indicates a mismatch between your credentials and Google Console configuration.

## Steps to Fix

### 1. Verify Google Cloud Console Settings
Go to: https://console.cloud.google.com/apis/credentials

**Check these exact settings:**
- Client ID: `386940582280-c77j4h2r4mjsssk9aus510qbcl1rh3.apps.googleusercontent.com`
- Authorized redirect URIs must include EXACTLY:
  ```
  https://autojobr.com/api/auth/callback/google
  ```

### 2. Common Causes & Solutions

**A. Redirect URI Mismatch**
- Google Console has: `https://autojobr.com/api/auth/callback/google`
- Your app sends: `https://autojobr.com/api/auth/callback/google`
- These MUST match exactly (no trailing slashes, exact protocol, etc.)

**B. Client Type Mismatch**
- Ensure your OAuth client is configured as "Web application"
- NOT "Android app", "iOS app", or "Desktop application"

**C. Environment Mismatch**
- Your .env shows: `NODE_ENV="production"`
- Verify your OAuth client supports production domains

### 3. Debugging Steps

**Check your current logs:**
```bash
pm2 logs autojobr | grep "Google OAuth"
```

**Look for these debug messages:**
```
🔍 Google OAuth Configuration:
  - GOOGLE_CLIENT_ID: Set ✓
  - GOOGLE_CLIENT_SECRET: Set ✓
  - NODE_ENV: production
  - Google OAuth Enabled: true

🔍 Google OAuth Token Exchange Details:
  - Client ID: 386940582280-c77j4h2...
  - Redirect URI: https://autojobr.com/api/auth/callback/google
  - NODE_ENV: production
```

### 4. Immediate Fix
If the issue persists, try creating a NEW OAuth client in Google Console:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "AutoJobr Production"
5. Authorized redirect URIs: `https://autojobr.com/api/auth/callback/google`
6. Update your .env file with the new credentials
7. Restart PM2: `pm2 restart autojobr`

### 5. Test the Fix
1. Visit: https://autojobr.com/login
2. Click "Sign in with Google"
3. Monitor logs: `pm2 logs autojobr --lines 50`
4. Should see successful token exchange instead of "Client Authentication failed"