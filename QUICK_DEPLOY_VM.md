# 🚀 AutoJobr Linux VM Quick Deploy

## One-Command Deployment

### Fresh Ubuntu/CentOS VM
```bash
# Download and run the automated deployment script
curl -fsSL https://raw.githubusercontent.com/yourusername/autojobr/main/vm-deploy.sh | bash
```

### Or Clone and Deploy
```bash
git clone https://github.com/yourusername/autojobr.git
cd autojobr
chmod +x vm-deploy.sh
sudo ./vm-deploy.sh
```

## What the Script Does

✅ **System Setup**
- Updates system packages
- Installs Node.js 20
- Installs PostgreSQL
- Installs PM2 and Nginx

✅ **Database Configuration**
- Creates PostgreSQL database
- Sets up secure user credentials
- Configures automatic startup

✅ **Application Setup**
- Installs dependencies
- Creates production environment file
- Builds the application
- Sets up PM2 process management

✅ **Security & Performance**
- Configures Nginx reverse proxy
- Sets up firewall rules
- Enables automatic restarts
- Creates log monitoring

## Required API Keys

After deployment, edit `.env` file with your API keys:

```bash
nano .env
```

Add these required keys:
```bash
GROQ_API_KEY="your_groq_api_key"      # Get from console.groq.com
RESEND_API_KEY="your_resend_api_key"   # Get from resend.com
```

Then restart:
```bash
pm2 restart autojobr
```

## Access Your Application

- **Web Interface**: `http://YOUR_VM_IP`
- **API Health**: `http://YOUR_VM_IP/api/health`

## Quick Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs autojobr

# Restart app
pm2 restart autojobr

# Stop app
pm2 stop autojobr

# View database
sudo -u postgres psql autojobr
```

## Docker Alternative

For Docker deployment:

```bash
# Clone repository
git clone https://github.com/yourusername/autojobr.git
cd autojobr

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Deploy with Docker
docker-compose -f docker-compose.production.yml up -d
```

## SSL Setup (Optional)

For HTTPS with Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Troubleshooting

### App not starting?
```bash
pm2 logs autojobr
```

### Database issues?
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

### Port 80 blocked?
```bash
sudo ufw status
sudo netstat -tlnp | grep :80
```

## Support

The deployment script handles everything automatically. If you encounter issues:

1. Check the deployment logs
2. Verify your VM has at least 2GB RAM
3. Ensure ports 80 and 5000 are open
4. Confirm API keys are correctly set in `.env`

Happy deploying! 🎉