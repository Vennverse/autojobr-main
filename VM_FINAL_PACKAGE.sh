#!/bin/bash

# Final VM Deployment Package - Clean Version Without Redis
# This script copies the clean files to your VM and restarts the service

set -e

VM_IP="40.160.50.128"
VM_USER="username"  # Change this to your actual username
VM_PATH="/home/$VM_USER/autojobr-main"

echo "🚀 Deploying clean AutoJobr version to VM..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we can connect to VM
print_status "Testing VM connection..."
if ! ping -c 1 $VM_IP > /dev/null 2>&1; then
    echo "❌ Cannot reach VM at $VM_IP"
    exit 1
fi

print_status "✅ VM is reachable"

# Copy the clean session store
print_status "Copying clean session store..."
scp server/sessionStore-simple.ts $VM_USER@$VM_IP:$VM_PATH/server/sessionStore.ts

# Copy the simple health check
print_status "Copying simple health check..."
scp server/healthCheck-simple.ts $VM_USER@$VM_IP:$VM_PATH/server/healthCheck.ts

# Copy updated auth file
print_status "Copying updated auth configuration..."
scp server/auth.ts $VM_USER@$VM_IP:$VM_PATH/server/auth.ts

# Copy updated routes file
print_status "Copying updated routes..."
scp server/routes.ts $VM_USER@$VM_IP:$VM_PATH/server/routes.ts

# Create a simple restart script on the VM
print_status "Creating restart script on VM..."
ssh $VM_USER@$VM_IP "cat > $VM_PATH/restart-clean.sh << 'EOF'
#!/bin/bash
cd $VM_PATH
echo '🔄 Restarting AutoJobr with clean configuration...'
pm2 restart ecosystem.config.js
sleep 3
echo '📊 Checking status...'
pm2 status
echo '🔍 Testing endpoints...'
curl -s http://localhost:5000/api/health/simple || echo 'Health check endpoint not ready yet'
echo ''
echo '✅ AutoJobr restarted successfully!'
echo '🌐 VM URL: http://$VM_IP:5000'
echo '📋 Check logs: pm2 logs autojobr'
EOF"

# Make restart script executable
ssh $VM_USER@$VM_IP "chmod +x $VM_PATH/restart-clean.sh"

# Run the restart script
print_status "Restarting AutoJobr on VM..."
ssh $VM_USER@$VM_IP "$VM_PATH/restart-clean.sh"

print_status "🎉 Deployment completed!"
print_status ""
print_status "Next steps:"
print_status "1. Test VM connection: curl http://$VM_IP:5000/api/health/simple"
print_status "2. Test Chrome extension - should now show 'Connected'"
print_status "3. Try autofill features on job sites"
print_status ""
print_status "If you need to check logs: ssh $VM_USER@$VM_IP && pm2 logs autojobr"