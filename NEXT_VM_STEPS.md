# Next Steps for VM Deployment

## Current Status
You're at: `/var/www/autojobr` and the code is in `autojobr-main` directory.

## Step 1: Move into the application directory and set up
```bash
# Move into the application directory
cd autojobr-main

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://autojobr_user:secure_password_123@localhost:5432/autojobr

# Add your API keys here (replace with real values)
GROQ_API_KEY=your_groq_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
RESEND_API_KEY=your_resend_api_key_here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Session secret (generate a random string)
SESSION_SECRET=$(openssl rand -base64 32)
EOF

# Set proper permissions for environment file
chmod 600 .env
```

## Step 2: Build and deploy database schema
```bash
# Push database schema to PostgreSQL
npm run db:push

# Build the application
npm run build
```

## Step 3: Test the application
```bash
# Test run the application
npm start
```

If everything works, you should see the application starting. Press `Ctrl+C` to stop it, then proceed to Step 4.

## Step 4: Set up PM2 for production
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'autojobr',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

## Step 5: Check if application is running
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs autojobr

# Test if application responds
curl -I http://localhost:3000
```

## Step 6: Configure Nginx (if not done already)
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/autojobr << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Final checks
```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Test external access (replace with your VM's IP)
curl -I http://your-vm-ip-address
```

## Troubleshooting

If you encounter issues:

1. **npm install fails**: Check Node.js version with `node --version` (should be 20.x)
2. **Database connection fails**: Verify PostgreSQL is running: `sudo systemctl status postgresql`
3. **Build fails**: Check for any TypeScript errors in the logs
4. **PM2 won't start**: Check the logs with `pm2 logs autojobr`
5. **Nginx 502 error**: Ensure the application is running on port 3000

## API Keys Setup

Remember to replace the placeholder API keys in `.env` with real ones:
- GROQ_API_KEY: Get from console.groq.com
- STRIPE keys: Get from dashboard.stripe.com  
- PAYPAL keys: Get from developer.paypal.com
- RESEND_API_KEY: Get from resend.com

After updating API keys, restart the application:
```bash
pm2 restart autojobr
```