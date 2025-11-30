# Ubuntu Setup Guide for Performance Frontend

Complete guide to install and run the Next.js frontend on Ubuntu.

## Prerequisites

### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js and npm

#### Option A: Using NodeSource (Recommended - Latest LTS)

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### Option B: Using Ubuntu Repository

```bash
sudo apt install -y nodejs npm
```

### 3. Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 4. Install Build Tools (for native modules)

```bash
sudo apt install -y build-essential
```

## Project Setup

### 1. Navigate to Project Directory

```bash
cd /path/to/performance-test-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Application

```bash
npm run build
```

## Running with PM2

### Start the Frontend

```bash
npm run pm2:start
```

Or directly:
```bash
pm2 start ecosystem.config.js
```

### Check Status

```bash
npm run pm2:status
# or
pm2 status
```

### View Logs

```bash
npm run pm2:logs
# or
pm2 logs performance-frontend
```

## Setup PM2 to Start on System Boot

### 1. Save Current PM2 Process List

```bash
pm2 save
```

### 2. Generate Startup Script

```bash
pm2 startup
```

This will output a command like:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your_username --hp /home/your_username
```

### 3. Run the Generated Command

Copy and run the command from step 2.

## Running Both Frontend and Backend

If you have both projects:

```bash
# Terminal 1 - Backend
cd /path/to/performance-server
npm install
npm run build
pm2 start ecosystem.config.js

# Terminal 2 - Frontend
cd /path/to/performance-test-app
npm install
npm run build
pm2 start ecosystem.config.js

# View all processes
pm2 list

# Save all processes
pm2 save

# Setup auto-start
pm2 startup  # Follow instructions
```

## Complete Installation Script

Save this as `install-ubuntu.sh` and run: `chmod +x install-ubuntu.sh && ./install-ubuntu.sh`

```bash
#!/bin/bash

echo "🚀 Installing Performance Frontend on Ubuntu..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install build tools
echo "📦 Installing build tools..."
sudo apt install -y build-essential

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Create logs directory
mkdir -p logs

echo "✅ Installation complete!"
echo ""
echo "To start the frontend:"
echo "  npm run pm2:start"
echo ""
echo "To check status:"
echo "  pm2 status"
```

## Quick Reference

```bash
# Full setup
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential
sudo npm install -g pm2
npm install
npm run build
npm run pm2:start
pm2 save
pm2 startup  # Follow the instructions
```

## Access the Application

After starting, the frontend will be available at:
- **Local**: http://localhost:3001
- **Network**: http://your-server-ip:3001

Make sure the backend is also running on port 3000!

