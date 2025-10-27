# Ubuntu Server Deployment Guide for AutoJobr

## Prerequisites

- Ubuntu 18.04 LTS or newer
- Root or sudo access
- Internet connection

## Quick Setup

1. **Run the setup script:**
   ```bash
   chmod +x ubuntu-setup.sh
   ./ubuntu-setup.sh
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

4. **Build and start the application:**
   ```bash
   npm run build
   npm start
   ```

## System Dependencies Explained

### Browser Dependencies (Critical for PDF Generation)
These packages are required for Puppeteer to work properly:

- **chromium-browser**: The browser engine for PDF generation
- **libxkbcommon0, libgbm1**: Core graphics libraries
- **libnss3, libcups2**: Security and printing support
- **libgtk-3-0, libgdk-pixbuf2.0-0**: UI rendering libraries

### Alternative Browser Setup
If Chromium doesn't work, the script also installs Google Chrome as a backup.

## Environment Variables for Production

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/autojobr"

# AI Services
GROQ_API_KEY="your_groq_api_key"

# Email Services  
RESEND_API_KEY="your_resend_api_key"

# Payment Services
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"

# OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Server
NODE_ENV=production
PORT=5000
```

## Browser Configuration for Production

The application will automatically try these browser paths in order:
1. `/usr/bin/google-chrome` (Google Chrome)
2. `/usr/bin/chromium-browser` (Chromium)
3. Puppeteer's bundled Chromium

## Troubleshooting

### If PDF generation fails:
1. Check browser installation: `which google-chrome` or `which chromium-browser`
2. Test browser manually: `google-chrome --headless --no-sandbox --dump-dom https://google.com`
3. Check file permissions: `ls -la uploads/`

### If dependencies are missing:
```bash
sudo apt install --fix-missing
sudo apt update && sudo apt upgrade
```

### Common Ubuntu versions commands:
```bash
# Ubuntu 20.04+
sudo apt install chromium-browser

# Ubuntu 18.04
sudo apt install chromium-browser
```

## File Storage

The application stores files in `./uploads/resumes/` with gzip compression. Ensure this directory has proper permissions:

```bash
mkdir -p uploads/resumes
chmod 755 uploads uploads/resumes
```

## Production Deployment with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "autojobr" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Security Considerations

1. Run the application as a non-root user
2. Use a reverse proxy (Nginx) for SSL termination
3. Set up firewall rules to restrict access
4. Use environment variables for sensitive data
5. Regularly update system packages

## Performance Optimization

1. Use SSD storage for file uploads
2. Configure adequate RAM (minimum 2GB recommended)
3. Use PostgreSQL connection pooling
4. Set up Redis for session storage in production