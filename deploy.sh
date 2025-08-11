#!/bin/bash

# AutoJobr Production Deployment Script
echo "🚀 Starting AutoJobr deployment..."

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop autojobr || echo "No existing process to stop"
pm2 delete autojobr || echo "No existing process to delete"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the frontend
echo "🏗️  Building frontend..."
npm run build

# Start the application with PM2
echo "🎬 Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Show status
echo "📊 Application status:"
pm2 status

# Show logs for verification
echo "📝 Recent logs:"
pm2 logs autojobr --lines 10

echo "✅ Deployment completed!"
echo "🌐 Application should be running at https://autojobr.com"
echo "📋 Use 'pm2 logs autojobr' to monitor logs"
echo "📋 Use 'pm2 restart autojobr' to restart"
echo "📋 Use 'pm2 stop autojobr' to stop"