# OAuth Setup Guide for AutoJobr

This guide walks you through setting up social login (Google, GitHub, LinkedIn) for your AutoJobr application.

## Overview

AutoJobr supports multiple OAuth providers:
- **Google OAuth 2.0** - Most popular social login
- **GitHub OAuth** - Developer-friendly authentication  
- **LinkedIn OAuth** - Professional network integration

## Prerequisites

- Your AutoJobr application deployed and running
- Domain name configured (required for OAuth callback URLs)
- Access to developer consoles for each provider

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"

### Step 2: Configure OAuth Consent Screen
1. Click "OAuth consent screen" in the sidebar
2. Choose "External" user type (unless using Google Workspace)
3. Fill in required information:
   - **App name**: AutoJobr
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes: `userinfo.email`, `userinfo.profile`, `openid`
5. Save and continue

### Step 3: Create OAuth 2.0 Client ID
1. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
2. Choose "Web application"
3. Configure:
   - **Name**: AutoJobr Web Client
   - **Authorized JavaScript origins**: 
     - `https://yourdomain.com`
     - `http://localhost:5000` (for development)
   - **Authorized redirect URIs**:
     - `https://yourdomain.com/api/auth/callback/google`
     - `http://localhost:5000/api/auth/callback/google` (for development)
4. Save and note down:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## 2. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: AutoJobr
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`
   - **Application description**: Job application platform with AI-powered features
4. Click "Register application"

### Step 2: Generate Client Secret
1. In your OAuth App settings, click "Generate a new client secret"
2. Note down:
   - `GITHUB_CLIENT_ID` (Client ID from the app page)
   - `GITHUB_CLIENT_SECRET` (Generated secret)

### Step 3: Configure Permissions
GitHub OAuth automatically provides:
- User profile information
- Email addresses (public and private)
- Repository access (optional - not used by AutoJobr)

## 3. LinkedIn OAuth Setup

### Step 1: Create LinkedIn App
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Click "Create app"
3. Fill in details:
   - **App name**: AutoJobr
   - **LinkedIn Page**: Create a company page or use personal
   - **Privacy policy URL**: `https://yourdomain.com/privacy`
   - **App logo**: Upload your logo
4. Click "Create app"

### Step 2: Configure OAuth Settings
1. Go to "Auth" tab in your LinkedIn app
2. Add OAuth 2.0 redirect URLs:
   - `https://yourdomain.com/api/auth/callback/linkedin`
   - `http://localhost:5000/api/auth/callback/linkedin` (for development)
3. Request permissions:
   - `r_liteprofile` (basic profile info)
   - `r_emailaddress` (email address)

### Step 3: Get Credentials
1. Note down from the "Auth" tab:
   - `LINKEDIN_CLIENT_ID` (Client ID)
   - `LINKEDIN_CLIENT_SECRET` (Client Secret)

## 4. Environment Configuration

Add all OAuth credentials to your environment configuration:

### For Linux VM Deployment
Edit `/var/www/autojobr/.env`:
```bash
# OAuth Authentication
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here

# NextAuth Secret (generate a random string)
NEXTAUTH_SECRET=your_secure_random_string_here
```

### For Docker Deployment
Edit your `.env` file for docker-compose:
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
NEXTAUTH_SECRET=your_secure_random_string_here
```

### For Replit
Add these as Replit Secrets:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `NEXTAUTH_SECRET`

## 5. Generate NextAuth Secret

The `NEXTAUTH_SECRET` is used to encrypt session tokens. Generate a secure random string:

```bash
# Option 1: Using openssl
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.now.sh/32
```

## 6. Testing OAuth Setup

### Development Testing
1. Start your application locally: `npm run dev`
2. Visit `http://localhost:5000`
3. Try logging in with each OAuth provider
4. Check browser developer tools for any errors

### Production Testing
1. Deploy your application to your domain
2. Ensure HTTPS is properly configured
3. Test each OAuth provider
4. Monitor server logs for any authentication errors

## 7. Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Ensure callback URLs exactly match in OAuth provider settings
   - Check for trailing slashes and HTTP vs HTTPS

2. **"Invalid client"**
   - Verify client ID and secret are correctly configured
   - Check environment variables are loaded properly

3. **"Access denied"**
   - Ensure OAuth consent screen is properly configured
   - Check if app is in testing mode (Google requires verification for production)

4. **"Scope not authorized"**
   - Verify requested scopes are approved in provider settings
   - Some scopes require app verification

### Debug Commands

```bash
# Check environment variables
printenv | grep -E "(GOOGLE|GITHUB|LINKEDIN|NEXTAUTH)"

# Test database connection
npm run db:push

# Check application logs
pm2 logs autojobr
# or for direct node
tail -f logs/combined.log
```

### OAuth Flow Testing

You can test individual OAuth flows by directly accessing:
- `https://yourdomain.com/api/auth/signin/google`
- `https://yourdomain.com/api/auth/signin/github`
- `https://yourdomain.com/api/auth/signin/linkedin`

## 8. Security Best Practices

1. **Use HTTPS in Production**
   - OAuth providers require HTTPS for production apps
   - Configure SSL certificates properly

2. **Secure Client Secrets**
   - Never commit secrets to version control
   - Use environment variables or secret management services
   - Rotate secrets periodically

3. **Validate Redirect URIs**
   - Only whitelist necessary callback URLs
   - Use exact matches, avoid wildcards

4. **Monitor Authentication Logs**
   - Track failed login attempts
   - Monitor for suspicious OAuth activity
   - Set up alerts for authentication errors

## 9. Provider-Specific Notes

### Google OAuth
- Requires app verification for production use
- Has strict redirect URI validation
- Provides detailed user profile information

### GitHub OAuth
- Simpler setup process
- Good for developer-focused applications
- Provides GitHub username and avatar

### LinkedIn OAuth
- Requires company page association
- Provides professional profile data
- Has stricter approval process for some permissions

## 10. Next Steps

After OAuth setup:
1. Test all authentication flows
2. Configure user role assignment (job seeker vs recruiter)
3. Set up email verification (optional with OAuth)
4. Configure session management
5. Test user profile synchronization

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review provider-specific documentation
3. Check AutoJobr application logs
4. Verify environment variable configuration