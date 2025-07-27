#!/bin/bash

# VM Redis and PgBouncer Setup Script for AutoJobr
# This script adds Redis and PgBouncer to existing VM deployment

set -e

echo "🚀 Setting up Redis and PgBouncer on VM deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Run as regular user with sudo privileges."
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect OS version"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Install Redis
install_redis() {
    print_status "Installing Redis..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update
        sudo apt install -y redis-server
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        sudo yum install -y epel-release
        sudo yum install -y redis
    else
        print_error "Unsupported OS for automatic Redis installation"
        exit 1
    fi
}

# Configure Redis
configure_redis() {
    print_status "Configuring Redis..."
    
    # Backup original config
    sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup 2>/dev/null || \
    sudo cp /etc/redis.conf /etc/redis.conf.backup 2>/dev/null || true
    
    # Redis configuration for AutoJobr
    sudo tee /etc/redis/autojobr.conf > /dev/null <<EOF
# Redis configuration for AutoJobr
port 6379
bind 127.0.0.1
timeout 0
keepalive 300
tcp-backlog 511

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename autojobr.rdb
dir /var/lib/redis

# Logging
loglevel notice
logfile /var/log/redis/autojobr.log

# Security
requirepass autojobr_secure_$(openssl rand -hex 16)

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511
databases 16

# Session-specific optimizations
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
EOF

    # Update Redis service to use custom config
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo systemctl stop redis-server || true
        sudo sed -i 's|/etc/redis/redis.conf|/etc/redis/autojobr.conf|g' /lib/systemd/system/redis-server.service
        sudo systemctl daemon-reload
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
    else
        sudo systemctl stop redis || true
        sudo sed -i 's|/etc/redis.conf|/etc/redis/autojobr.conf|g' /usr/lib/systemd/system/redis.service
        sudo systemctl daemon-reload
        sudo systemctl enable redis
        sudo systemctl start redis
    fi
}

# Install PgBouncer
install_pgbouncer() {
    print_status "Installing PgBouncer..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt install -y pgbouncer
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        sudo yum install -y pgbouncer
    else
        print_error "Unsupported OS for automatic PgBouncer installation"
        exit 1
    fi
}

# Configure PgBouncer
configure_pgbouncer() {
    print_status "Configuring PgBouncer..."
    
    # Get database connection details
    DB_HOST="${PGHOST:-localhost}"
    DB_PORT="${PGPORT:-5432}"
    DB_NAME="${PGDATABASE:-autojobr}"
    DB_USER="${PGUSER:-postgres}"
    
    # Backup original config
    sudo cp /etc/pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini.backup 2>/dev/null || true
    
    # PgBouncer configuration
    sudo tee /etc/pgbouncer/pgbouncer.ini > /dev/null <<EOF
[databases]
autojobr = host=$DB_HOST port=$DB_PORT dbname=$DB_NAME

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
server_check_query = select 1
server_lifetime = 3600
server_idle_timeout = 600

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
syslog = 0
syslog_facility = daemon
syslog_ident = pgbouncer

# Performance
tcp_defer_accept = 0
tcp_socket_buffer = 0
tcp_keepalive = 1
tcp_keepcnt = 0
tcp_keepidle = 0
tcp_keepintvl = 0

# Admin
admin_users = $DB_USER
stats_users = $DB_USER
EOF

    # Create userlist.txt
    sudo tee /etc/pgbouncer/userlist.txt > /dev/null <<EOF
"$DB_USER" "md5$(echo -n "${PGPASSWORD}${DB_USER}" | md5sum | cut -d' ' -f1)"
EOF

    # Set proper permissions
    sudo chown pgbouncer:pgbouncer /etc/pgbouncer/pgbouncer.ini
    sudo chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt
    sudo chmod 640 /etc/pgbouncer/pgbouncer.ini
    sudo chmod 640 /etc/pgbouncer/userlist.txt
    
    # Enable and start PgBouncer
    sudo systemctl enable pgbouncer
    sudo systemctl start pgbouncer
}

# Update environment variables
update_environment() {
    print_status "Updating environment variables..."
    
    # Add Redis and PgBouncer URLs to .env
    ENV_FILE="/home/$(whoami)/autojobr-main/.env"
    
    if [ -f "$ENV_FILE" ]; then
        # Get Redis password
        REDIS_PASSWORD=$(grep "requirepass" /etc/redis/autojobr.conf | awk '{print $2}')
        
        # Add Redis URL
        if ! grep -q "REDIS_URL" "$ENV_FILE"; then
            echo "REDIS_URL=redis://:${REDIS_PASSWORD}@127.0.0.1:6379/0" >> "$ENV_FILE"
        fi
        
        # Update DATABASE_URL to use PgBouncer
        if grep -q "DATABASE_URL" "$ENV_FILE"; then
            sed -i "s/:5432\//:6432\//" "$ENV_FILE"
        fi
        
        print_status "Updated $ENV_FILE with Redis and PgBouncer configurations"
    else
        print_warning "Environment file not found. Please manually add:"
        echo "REDIS_URL=redis://:${REDIS_PASSWORD}@127.0.0.1:6379/0"
        echo "And update DATABASE_URL port from 5432 to 6432"
    fi
}

# Update PM2 ecosystem
update_pm2_config() {
    print_status "Updating PM2 configuration..."
    
    ECOSYSTEM_FILE="/home/$(whoami)/autojobr-main/ecosystem.config.js"
    
    if [ -f "$ECOSYSTEM_FILE" ]; then
        # Add Redis URL to PM2 environment
        if ! grep -q "REDIS_URL" "$ECOSYSTEM_FILE"; then
            REDIS_PASSWORD=$(grep "requirepass" /etc/redis/autojobr.conf | awk '{print $2}')
            sed -i "/env: {/a\\        REDIS_URL: 'redis://:${REDIS_PASSWORD}@127.0.0.1:6379/0'," "$ECOSYSTEM_FILE"
        fi
        
        print_status "Updated PM2 ecosystem configuration"
    fi
}

# Test connections
test_connections() {
    print_status "Testing Redis and PgBouncer connections..."
    
    # Test Redis
    if redis-cli ping > /dev/null 2>&1; then
        print_status "✅ Redis connection successful"
    else
        print_error "❌ Redis connection failed"
    fi
    
    # Test PgBouncer
    if pg_isready -h 127.0.0.1 -p 6432 > /dev/null 2>&1; then
        print_status "✅ PgBouncer connection successful"
    else
        print_error "❌ PgBouncer connection failed"
    fi
}

# Main installation
main() {
    print_status "Starting Redis and PgBouncer setup for AutoJobr VM deployment"
    
    # Check if Redis is already installed
    if ! command -v redis-server &> /dev/null; then
        install_redis
    else
        print_status "Redis already installed, configuring..."
    fi
    
    configure_redis
    
    # Check if PgBouncer is already installed
    if ! command -v pgbouncer &> /dev/null; then
        install_pgbouncer
    else
        print_status "PgBouncer already installed, configuring..."
    fi
    
    configure_pgbouncer
    update_environment
    update_pm2_config
    test_connections
    
    print_status "✅ Redis and PgBouncer setup completed!"
    print_status "🔄 Please restart your AutoJobr application:"
    print_status "   cd /home/$(whoami)/autojobr-main"
    print_status "   pm2 restart ecosystem.config.js"
    print_status ""
    print_status "📊 Monitor services:"
    print_status "   Redis: sudo systemctl status redis-server"
    print_status "   PgBouncer: sudo systemctl status pgbouncer"
    print_status "   PM2: pm2 status"
}

# Run main function
main "$@"