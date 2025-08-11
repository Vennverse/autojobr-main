# VM Environment Variables Setup Guide

## Method 1: Using .env File (Recommended)

1. **SSH into your VM**:
```bash
ssh username@your-vm-ip
```

2. **Navigate to your application directory**:
```bash
cd /path/to/your/autojobr-app
```

3. **Create or edit the .env file**:
```bash
sudo nano .env
```

4. **Add your environment variables**:
```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_production_paypal_client_id
PAYPAL_CLIENT_SECRET=your_production_paypal_client_secret

# Database
DATABASE_URL=your_database_connection_string

# Stripe (if using)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Other required variables
NODE_ENV=production
PORT=5000
REPL_SLUG=your-app-name
REPL_OWNER=your-username
```

5. **Save and exit** (Ctrl+X, then Y, then Enter)

6. **Restart your application**:
```bash
# If using PM2
pm2 restart autojobr

# If using systemd
sudo systemctl restart autojobr

# If running directly
pkill -f node && npm start
```

## Method 2: System Environment Variables

1. **Edit system profile**:
```bash
sudo nano /etc/environment
```

2. **Add variables**:
```
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
DATABASE_URL="your_database_url"
```

3. **Reload environment**:
```bash
source /etc/environment
```

## Method 3: PM2 Ecosystem File

1. **Create ecosystem.config.js**:
```bash
nano ecosystem.config.js
```

2. **Configure with environment variables**:
```javascript
module.exports = {
  apps: [{
    name: 'autojobr',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      PAYPAL_CLIENT_ID: 'your_production_paypal_client_id',
      PAYPAL_CLIENT_SECRET: 'your_production_paypal_client_secret',
      DATABASE_URL: 'your_database_url'
    }
  }]
}
```

3. **Start with production config**:
```bash
pm2 start ecosystem.config.js --env production
```

## Method 4: Docker Environment (if using Docker)

1. **Edit docker-compose.yml**:
```yaml
services:
  app:
    environment:
      - PAYPAL_CLIENT_ID=your_paypal_client_id
      - PAYPAL_CLIENT_SECRET=your_paypal_client_secret
      - DATABASE_URL=your_database_url
```

2. **Or use .env file with Docker**:
```bash
# In docker-compose.yml
env_file:
  - .env
```

## Verification Steps

1. **Check if variables are loaded**:
```bash
# In your app directory
node -e "console.log('PayPal ID:', process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET')"
```

2. **Test PayPal connection**:
```bash
curl -X GET "http://your-vm-ip:5000/api/paypal/setup"
```

## Security Notes

- Never commit .env files to version control
- Use proper file permissions: `chmod 600 .env`
- Consider using a secrets management service for production
- Rotate keys regularly

## Troubleshooting

- If variables aren't loading, restart the entire service
- Check file permissions on .env file
- Ensure no syntax errors in environment files
- Verify the correct path to your application directory