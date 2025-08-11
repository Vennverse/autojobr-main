# AutoJobr Linux VM Deployment Guide

## Quick Setup Script

### 1. Download and Run the Auto-Deploy Script

```bash
# Download the repository and run automated setup
git clone https://github.com/Vennverse/autojobr-main.git
cd autojobr-main
chmod +x vm-deploy.sh
sudo ./vm-deploy.sh
```

## Manual Setup Instructions

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+ Linux VM
- At least 2GB RAM and 20GB disk space
- Root or sudo access

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

### Step 2: Setup Database

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE autojobr;
CREATE USER autojobr_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr_user;
ALTER USER autojobr_user CREATEDB;
\q
EOF
```

### Step 3: Configure Application

```bash
# Clone repository
git clone https://github.com/Vennverse/autojobr-main.git
cd autojobr-main

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` file with your configuration:

```bash
# Database
DATABASE_URL="postgresql://autojobr_user:your_secure_password@localhost:5432/autojobr"

# API Keys
GROQ_API_KEY="your_groq_api_key"
RESEND_API_KEY="your_resend_api_key"

# Optional Payment Keys
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"

# Server Configuration
NODE_ENV="production"
PORT="5000"
SESSION_SECRET="your_random_session_secret"
```

### Step 4: Setup Database Schema

```bash
# Push database schema
npm run db:push

# Build application
npm run build
```

### Step 5: Start with PM2

```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 6: Configure Nginx (Optional)

Create nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/autojobr
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GROQ_API_KEY` | AI features (get from console.groq.com) | Yes |
| `RESEND_API_KEY` | Email service (get from resend.com) | Yes |
| `PAYPAL_CLIENT_ID` | PayPal payments (optional) | No |
| `PAYPAL_CLIENT_SECRET` | PayPal payments (optional) | No |
| `SESSION_SECRET` | Random string for sessions | Yes |
| `NODE_ENV` | Set to "production" | Yes |
| `PORT` | Application port (default: 5000) | No |

## API Keys Setup

### 1. GROQ API Key
- Go to https://console.groq.com
- Create account and get free API key
- Add to `.env` file

### 2. RESEND API Key
- Go to https://resend.com
- Create account and get API key
- Add to `.env` file

### 3. PayPal (Optional)
- Go to https://developer.paypal.com
- Create app and get Client ID/Secret
- Add to `.env` file

## Monitoring and Maintenance

### Check Application Status
```bash
pm2 status
pm2 logs autojobr
```

### Update Application
```bash
cd autojobr
git pull
npm install
npm run build
pm2 restart autojobr
```

### Database Backup
```bash
pg_dump -h localhost -U autojobr_user autojobr > backup_$(date +%Y%m%d).sql
```

### Security Considerations

1. **Firewall**: Only open ports 80, 443, and 22
2. **SSL**: Use Let's Encrypt for HTTPS
3. **Updates**: Keep system and dependencies updated
4. **Monitoring**: Set up log monitoring and alerts

## Troubleshooting

### Common Issues

1. **Port 5000 in use**: Change PORT in .env
2. **Database connection failed**: Check DATABASE_URL
3. **API features not working**: Verify API keys
4. **Permission denied**: Check file permissions

### Logs Location
- Application logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/`

## Support

For issues or questions:
1. Check logs with `pm2 logs autojobr`
2. Verify environment variables are set
3. Ensure database is running
4. Check firewall settings