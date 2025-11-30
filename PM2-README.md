# PM2 Setup for Performance Frontend (Next.js)

PM2 process manager setup for the Next.js frontend application.

## Quick Start

### 1. Build the Application

```bash
npm run build
```

### 2. Start with PM2

```bash
npm run pm2:start
```

## Available PM2 Commands

```bash
# Start the frontend
npm run pm2:start

# Stop the frontend
npm run pm2:stop

# Restart the frontend
npm run pm2:restart

# Delete from PM2
npm run pm2:delete

# View logs
npm run pm2:logs

# Monitor (real-time)
npm run pm2:monit

# Check status
npm run pm2:status
```

## PM2 Direct Commands

```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop performance-frontend

# Restart
pm2 restart performance-frontend

# Delete
pm2 delete performance-frontend

# View logs
pm2 logs performance-frontend

# Monitor
pm2 monit

# Status
pm2 status
```

## Development vs Production

### Development Mode
For development, use:
```bash
npm run dev
```

### Production Mode with PM2
For production:
```bash
# Build first
npm run build

# Then start with PM2
npm run pm2:start
```

## Features

- **Auto-restart**: Automatically restarts if the app crashes
- **Logging**: All logs saved to `./logs/` directory
- **Memory limit**: Auto-restarts if memory exceeds 500MB
- **Monitoring**: Real-time monitoring with `pm2 monit`
- **Production ready**: Runs Next.js in production mode

## Logs

Logs are stored in:
- `./logs/out.log` - Standard output
- `./logs/err.log` - Error output

View logs in real-time:
```bash
pm2 logs performance-frontend
```

## Monitoring

View real-time monitoring:
```bash
pm2 monit
```

## Ubuntu Setup

For Ubuntu, see the main `UBUNTU-SETUP.md` in the backend folder, or:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Build and start
npm run build
npm run pm2:start

# Save and setup auto-start
pm2 save
pm2 startup  # Follow the instructions
```

## Running Both Frontend and Backend

You can run both with PM2:

```bash
# In backend directory
cd ../performance-server
npm run pm2:start

# In frontend directory
cd ../performance-test-app
npm run pm2:start

# View all processes
pm2 list
```

## Configuration

The PM2 configuration is in `ecosystem.config.js`. You can modify:
- `max_memory_restart`: Memory limit before restart (currently 500MB)
- `PORT`: Frontend port (currently 3001)
- `NODE_ENV`: Environment (production/development)

