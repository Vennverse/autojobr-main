#!/bin/bash

# Ubuntu Server Setup Script for AutoJobr
# This script installs all system dependencies required for PDF generation and browser automation

echo "🚀 Setting up AutoJobr on Ubuntu Server..."

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install Chrome/Chromium and dependencies for PDF generation
echo "🌐 Installing Chromium and browser dependencies..."
sudo apt install -y \
    chromium-browser \
    chromium-chromedriver \
    libxkbcommon0 \
    libgbm1 \
    libnss3 \
    libcups2 \
    libdrm2 \
    libxss1 \
    libgconf-2-4 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils

# Alternative: Install Google Chrome (more reliable than Chromium)
echo "🔍 Installing Google Chrome as backup browser..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Install Node.js and npm (if not already installed)
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install PostgreSQL (if not already installed)
echo "🗄️  Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "PostgreSQL already installed"
fi

# Create uploads directory with proper permissions
echo "📁 Setting up file storage directory..."
mkdir -p uploads/resumes
chmod 755 uploads
chmod 755 uploads/resumes

echo "✅ Ubuntu server setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Clone your project repository"
echo "2. Run 'npm install' to install Node.js dependencies"
echo "3. Set up your environment variables (DATABASE_URL, etc.)"
echo "4. Run 'npm run build' to build the application"
echo "5. Start the application with 'npm start'"
echo ""
echo "📋 Browser paths for reference:"
echo "  - Google Chrome: /usr/bin/google-chrome"
echo "  - Chromium: /usr/bin/chromium-browser"
echo ""