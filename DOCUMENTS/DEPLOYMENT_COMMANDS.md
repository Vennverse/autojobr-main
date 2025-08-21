# AutoJobr Linux VM Deployment Commands

## 🚀 Quick Start (One Command)

### Method 1: Direct Download & Deploy
```bash
curl -fsSL https://raw.githubusercontent.com/Vennverse/autojobr-main/main/vm-deploy.sh | bash
```

### Method 2: Clone & Deploy
```bash
git clone https://github.com/Vennverse/autojobr-main.git
cd autojobr-main
chmod +x vm-deploy.sh
sudo ./vm-deploy.sh
```

## After Deployment

### 1. Add API Keys
```bash
cd autojobr-main
nano .env
```

Add these lines:
```bash
GROQ_API_KEY="your_groq_api_key_here"
RESEND_API_KEY="your_resend_api_key_here"
```

### 2. Restart Application
```bash
pm2 restart autojobr
```

### 3. Check Status
```bash
pm2 status
pm2 logs autojobr
```

## Access Application

- **Website**: http://YOUR_VM_IP
- **Health Check**: http://YOUR_VM_IP/api/health

## Docker Alternative

```bash
git clone https://github.com/Vennverse/autojobr-main.git
cd autojobr-main
cp .env.example .env
# Edit .env with your API keys
docker-compose -f docker-compose.production.yml up -d
```

## Essential Commands

```bash
# Check application
pm2 status
pm2 logs autojobr
pm2 restart autojobr

# Check database
sudo -u postgres psql autojobr

# Check nginx
sudo systemctl status nginx
sudo nginx -t

# View application logs
tail -f logs/combined.log
```

That's it! The automated script handles everything else.