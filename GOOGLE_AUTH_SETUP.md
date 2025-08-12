# Google Auth Services Configuration Guide

## Step 1: Get Google OAuth Credentials

### Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"

### Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Enable these APIs:
   - Google+ API (for basic profile info)
   - People API (for user details)
   - Gmail API (if using email features)

### Create OAuth 2.0 Client
1. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client IDs"
2. Choose "Web application"
3. Configure:
   - **Name**: AutoJobr Web Client
   - **Authorized JavaScript origins**: 
     - `http://your-vm-ip:5000`
     - `https://your-domain.com` (if you have a domain)
   - **Authorized redirect URIs**:
     - `http://your-vm-ip:5000/auth/google/callback`
     - `https://your-domain.com/auth/google/callback`

### Get Your Credentials
- **Client ID**: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnop`

## Step 2: Environment Variables

Add these to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://your-vm-ip:5000/auth/google/callback

# Optional: Google Services
GOOGLE_API_KEY=your_google_api_key_here (for server-side API calls)
```

## Step 3: Implementation Options

### Option A: Passport.js Google Strategy (Recommended)
```javascript
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  // Handle user authentication
  return done(null, profile);
}));
```

### Option B: NextAuth.js Google Provider
```javascript
import GoogleProvider from "next-auth/providers/google"

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
})
```

## Step 4: Security Considerations

1. **Environment Security**:
   ```bash
   chmod 600 .env
   ```

2. **Domain Restrictions**: Only add trusted domains to OAuth config

3. **HTTPS in Production**: Always use HTTPS for production deployments

4. **Regular Key Rotation**: Rotate secrets every 90 days

## Step 5: Testing

1. **Test OAuth Flow**:
   ```bash
   curl "http://your-vm-ip:5000/auth/google"
   ```

2. **Verify Environment**:
   ```bash
   node -e "console.log('Google ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET')"
   ```

## Common Issues

1. **Invalid Redirect URI**: Ensure exact match in Google Console
2. **API Not Enabled**: Enable required Google APIs
3. **Quota Exceeded**: Check API usage limits
4. **Invalid Client**: Verify Client ID and Secret

## Required Packages

```bash
npm install passport passport-google-oauth20 express-session
# OR for NextAuth
npm install next-auth
```