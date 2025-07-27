# Redis and PgBouncer Setup Guide for VM Deployment

This guide explains how to add Redis session storage and PgBouncer connection pooling to your existing AutoJobr VM deployment.

## Quick Setup (Automated)

Run the automated setup script:

```bash
# Download and run the setup script
chmod +x vm-redis-pgbouncer-setup.sh
./vm-redis-pgbouncer-setup.sh
```

## Manual Setup Instructions

### 1. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y redis-server
```

**CentOS/RHEL/Rocky:**
```bash
sudo yum install -y epel-release
sudo yum install -y redis
```

### 2. Configure Redis for AutoJobr

Create Redis configuration file:
```bash
sudo nano /etc/redis/autojobr.conf
```

Add the following configuration:
```conf
# Redis configuration for AutoJobr
port 6379
bind 127.0.0.1
timeout 0
keepalive 300

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
rdbcompression yes
dbfilename autojobr.rdb
dir /var/lib/redis

# Security
requirepass your_secure_redis_password_here

# Session optimizations
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
tcp-keepalive 300
databases 16
```

Update Redis service configuration:
```bash
# Ubuntu/Debian
sudo sed -i 's|/etc/redis/redis.conf|/etc/redis/autojobr.conf|g' /lib/systemd/system/redis-server.service

# CentOS/RHEL
sudo sed -i 's|/etc/redis.conf|/etc/redis/autojobr.conf|g' /usr/lib/systemd/system/redis.service

# Restart services
sudo systemctl daemon-reload
sudo systemctl enable redis-server  # or 'redis' on CentOS
sudo systemctl start redis-server   # or 'redis' on CentOS
```

### 3. Install PgBouncer

**Ubuntu/Debian:**
```bash
sudo apt install -y pgbouncer
```

**CentOS/RHEL/Rocky:**
```bash
sudo yum install -y pgbouncer
```

### 4. Configure PgBouncer

Edit PgBouncer configuration:
```bash
sudo nano /etc/pgbouncer/pgbouncer.ini
```

Add configuration:
```ini
[databases]
autojobr = host=localhost port=5432 dbname=autojobr

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Connection pooling
pool_mode = session
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5

# Connection management
server_reset_query = DISCARD ALL
server_check_delay = 30
server_lifetime = 3600
server_idle_timeout = 600

# Admin access
admin_users = postgres
stats_users = postgres
```

Create user authentication file:
```bash
sudo nano /etc/pgbouncer/userlist.txt
```

Add your database user (replace with your actual password hash):
```
"postgres" "md5your_password_hash_here"
```

Set proper permissions:
```bash
sudo chown pgbouncer:pgbouncer /etc/pgbouncer/pgbouncer.ini
sudo chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt
sudo chmod 640 /etc/pgbouncer/pgbouncer.ini
sudo chmod 640 /etc/pgbouncer/userlist.txt
```

Start PgBouncer:
```bash
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer
```

### 5. Update Environment Variables

Edit your `.env` file:
```bash
nano /home/username/autojobr-main/.env
```

Add Redis configuration:
```env
# Redis session storage
REDIS_URL=redis://:your_redis_password@127.0.0.1:6379/0

# Update database URL to use PgBouncer (change port from 5432 to 6432)
DATABASE_URL=postgresql://username:password@localhost:6432/autojobr
```

### 6. Update PM2 Ecosystem Configuration

Edit PM2 configuration:
```bash
nano /home/username/autojobr-main/ecosystem.config.js
```

Add Redis URL to environment variables:
```javascript
module.exports = {
  apps: [{
    name: 'autojobr',
    script: 'npm run start',
    cwd: '/home/username/autojobr-main',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://username:password@localhost:6432/autojobr',
      REDIS_URL: 'redis://:your_redis_password@127.0.0.1:6379/0',
      // ... other environment variables
    }
  }]
};
```

### 7. Copy Updated Server Files

Copy the new Redis and PgBouncer files from your Replit environment to your VM:

```bash
# Copy these files to your VM deployment
scp server/redis.ts username@your-vm-ip:/home/username/autojobr-main/server/
scp server/sessionStore.ts username@your-vm-ip:/home/username/autojobr-main/server/
scp server/pgbouncer.ts username@your-vm-ip:/home/username/autojobr-main/server/
scp server/healthCheck.ts username@your-vm-ip:/home/username/autojobr-main/server/
```

### 8. Restart Application

Restart your AutoJobr application:
```bash
cd /home/username/autojobr-main
pm2 restart ecosystem.config.js
```

### 9. Verify Installation

Check service status:
```bash
# Check Redis
redis-cli ping
sudo systemctl status redis-server

# Check PgBouncer
pg_isready -h 127.0.0.1 -p 6432
sudo systemctl status pgbouncer

# Check PM2
pm2 status
pm2 logs autojobr

# Test health endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/simple
```

## Health Monitoring

Your application now includes comprehensive health check endpoints:

- **Simple Health Check**: `/api/health/simple`
- **Detailed Health Check**: `/api/health` (includes Redis and PgBouncer status)

## Troubleshooting

### Redis Issues

1. **Connection refused**: Check if Redis is running
   ```bash
   sudo systemctl status redis-server
   sudo systemctl start redis-server
   ```

2. **Authentication failed**: Verify Redis password in configuration
   ```bash
   redis-cli -a your_password ping
   ```

### PgBouncer Issues

1. **Connection refused**: Check PgBouncer status
   ```bash
   sudo systemctl status pgbouncer
   sudo journalctl -u pgbouncer
   ```

2. **Authentication failed**: Verify userlist.txt and database credentials
   ```bash
   psql -h 127.0.0.1 -p 6432 -U username -d autojobr
   ```

### Application Issues

1. **Check PM2 logs**:
   ```bash
   pm2 logs autojobr
   ```

2. **Verify environment variables**:
   ```bash
   pm2 env autojobr
   ```

## Performance Benefits

With Redis and PgBouncer enabled, you'll get:

- **Session Storage**: Fast, scalable session management with Redis
- **Connection Pooling**: Efficient database connections with PgBouncer
- **Fallback Support**: Graceful fallback to memory store if Redis is unavailable
- **Health Monitoring**: Real-time status monitoring of all services
- **Production Ready**: Enhanced performance and reliability for production deployments

## Security Notes

1. **Redis Security**: 
   - Redis is bound to localhost only
   - Password authentication is required
   - Regular security updates recommended

2. **PgBouncer Security**:
   - Connections limited to localhost
   - User authentication required
   - Proper file permissions set

3. **Firewall Configuration**:
   - Redis (6379) and PgBouncer (6432) should only be accessible locally
   - Only expose port 5000 for the main application

This setup provides production-grade session management and database connection pooling for your AutoJobr VM deployment.