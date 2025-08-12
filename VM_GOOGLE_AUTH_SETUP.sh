#!/bin/bash

# VM Google Auth Setup Script
# This script will configure Google OAuth for your AutoJobr application

echo "🔐 AutoJobr Google Auth Configuration"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from your app root directory.${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Current directory: $(pwd)${NC}"

# Get server details
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "${BLUE}🌐 Detected server IP: $SERVER_IP${NC}"

# Backup current .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backup created for existing .env file${NC}"
fi

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    if [ -n "$default_value" ]; then
        read -p "$prompt [$default_value]: " input
        eval "$var_name=\"\${input:-$default_value}\""
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

echo -e "${YELLOW}📝 Google OAuth Configuration${NC}"
echo "Please provide your Google OAuth credentials:"
echo ""

# Get Google OAuth credentials
prompt_input "Google Client ID" GOOGLE_CLIENT_ID
prompt_input "Google Client Secret" GOOGLE_CLIENT_SECRET
prompt_input "Server domain (without http/https)" SERVER_DOMAIN "$SERVER_IP:5000"

# Construct callback URL
CALLBACK_URL="http://$SERVER_DOMAIN/auth/google/callback"

echo ""
echo -e "${BLUE}🔧 Configuration Summary:${NC}"
echo "Client ID: ${GOOGLE_CLIENT_ID:0:20}..."
echo "Callback URL: $CALLBACK_URL"
echo ""

# Add Google OAuth configuration to .env
echo -e "${YELLOW}📝 Updating .env file...${NC}"

# Check if Google config already exists
if grep -q "GOOGLE_CLIENT_ID" .env 2>/dev/null; then
    # Update existing entries
    sed -i "s/^GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=\"$GOOGLE_CLIENT_ID\"/" .env
    sed -i "s/^GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=\"$GOOGLE_CLIENT_SECRET\"/" .env
    sed -i "s/^GOOGLE_CALLBACK_URL=.*/GOOGLE_CALLBACK_URL=\"$CALLBACK_URL\"/" .env
    echo -e "${GREEN}✅ Updated existing Google OAuth configuration${NC}"
else
    # Add new Google OAuth section
    cat >> .env << EOL

# Google OAuth Configuration
GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="$CALLBACK_URL"

# Optional: Google API Key for server-side calls
GOOGLE_API_KEY=""
EOL
    echo -e "${GREEN}✅ Added Google OAuth configuration to .env${NC}"
fi

# Set proper permissions
chmod 600 .env
echo -e "${GREEN}🔒 File permissions set to 600 (owner read/write only)${NC}"

# Install required packages if needed
echo -e "${YELLOW}📦 Checking required packages...${NC}"

PACKAGES_TO_INSTALL=()

# Check for passport and google strategy
if ! npm list passport &>/dev/null; then
    PACKAGES_TO_INSTALL+=("passport")
fi

if ! npm list passport-google-oauth20 &>/dev/null; then
    PACKAGES_TO_INSTALL+=("passport-google-oauth20")
fi

if ! npm list express-session &>/dev/null; then
    PACKAGES_TO_INSTALL+=("express-session")
fi

if [ ${#PACKAGES_TO_INSTALL[@]} -gt 0 ]; then
    echo -e "${YELLOW}📦 Installing required packages: ${PACKAGES_TO_INSTALL[*]}${NC}"
    npm install "${PACKAGES_TO_INSTALL[@]}"
    echo -e "${GREEN}✅ Packages installed successfully${NC}"
else
    echo -e "${GREEN}✅ All required packages are already installed${NC}"
fi

# Create Google Auth strategy file
echo -e "${YELLOW}📝 Creating Google Auth strategy...${NC}"

mkdir -p server/auth

cat > server/auth/googleStrategy.js << 'EOL'
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = (passport) => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract user information from Google profile
      const userData = {
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profileImage: profile.photos[0].value,
        accessToken: accessToken,
        refreshToken: refreshToken
      };

      // Here you would typically:
      // 1. Check if user exists in database
      // 2. Create new user if doesn't exist
      // 3. Update existing user info
      
      console.log('Google Auth Success:', userData.email);
      return done(null, userData);
    } catch (error) {
      console.error('Google Auth Error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};
EOL

echo -e "${GREEN}✅ Google Auth strategy created${NC}"

# Create auth routes
cat > server/auth/googleRoutes.js << 'EOL'
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login?error=google_auth_failed' 
  }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard?auth=success');
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
EOL

echo -e "${GREEN}✅ Google Auth routes created${NC}"

# Restart the application
echo -e "${YELLOW}🔄 Restarting application...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo -e "${GREEN}✅ PM2 applications restarted${NC}"
elif systemctl is-active --quiet autojobr; then
    sudo systemctl restart autojobr
    echo -e "${GREEN}✅ Systemd service restarted${NC}"
else
    echo -e "${YELLOW}⚠️  Please manually restart your application${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Google Auth setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Google Cloud Console Configuration:${NC}"
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Navigate to: APIs & Services > Credentials"
echo "3. Add these to your OAuth 2.0 client:"
echo "   Authorized JavaScript origins:"
echo "   • http://$SERVER_DOMAIN"
echo "   Authorized redirect URIs:"
echo "   • $CALLBACK_URL"
echo ""
echo -e "${BLUE}🧪 Test URLs:${NC}"
echo "• Auth initiation: http://$SERVER_DOMAIN/auth/google"
echo "• Manual test: curl http://$SERVER_DOMAIN/auth/google"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Configure OAuth consent screen in Google Cloud Console"
echo "2. Add test users if app is in testing mode"
echo "3. Integrate auth routes into your main app"
echo "4. Test the complete authentication flow"
EOL