#!/bin/bash

echo "🚀 Quick AutoJobr Deployment (OAuth Fixed)"

# Restart PM2 with updated OAuth debugging
pm2 restart autojobr

# Show immediate logs to verify OAuth configuration
echo "📊 Checking OAuth Configuration..."
sleep 2
pm2 logs autojobr --lines 20 | grep -E "(Google OAuth|🔍|✅|❌)"

echo ""
echo "🔗 Test Google OAuth at: https://autojobr.com/login"
echo "📝 Monitor logs: pm2 logs autojobr"
echo "📋 Full logs: pm2 logs autojobr --lines 50"