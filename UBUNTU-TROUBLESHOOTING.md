# Ubuntu Troubleshooting Guide

## Error: errno 13 (Permission Denied)

If you see `errno: 13` or `Unknown system error 13` when starting with PM2, try these solutions:

### Solution 1: Check Port Availability

```bash
# Check if port 3001 is in use
sudo netstat -tulpn | grep 3001
# or
sudo ss -tulpn | grep 3001

# If port is in use, kill the process or change the port
sudo kill -9 <PID>
```

### Solution 2: Change Port

Edit `ecosystem.config.js` and change PORT to a different port (e.g., 3002, 8080):

```javascript
env: {
  PORT: 3002,  // Change from 3001
}
```

### Solution 3: Run with Proper Permissions

```bash
# Make sure you're not running as root unnecessarily
# If needed, run PM2 as your user
pm2 start ecosystem.config.js

# Or if you need root, use sudo
sudo pm2 start ecosystem.config.js
```

### Solution 4: Check Firewall

```bash
# Allow the port through firewall
sudo ufw allow 3001/tcp

# Check firewall status
sudo ufw status
```

### Solution 5: Use Different Host Binding

The config now uses `0.0.0.0` which should work. If issues persist:

```bash
# Try binding to localhost only
# Edit start-server.js and change to:
process.argv = ['node', 'next', 'start', '-p', '3001', '-H', '127.0.0.1'];
```

### Solution 6: Check Node.js Permissions

```bash
# Check if Node.js can access network interfaces
node -e "console.log(require('os').networkInterfaces())"

# If this fails, there might be system-level permission issues
```

### Solution 7: Run Next.js Directly (Test)

```bash
# Build first
npm run build

# Try running directly (not with PM2) to isolate the issue
npm run start

# If this works, the issue is PM2-specific
```

### Solution 8: PM2 User Permissions

```bash
# If running PM2 as root, switch to your user
pm2 kill
pm2 start ecosystem.config.js --uid $(whoami) --gid $(whoami)
```

### Solution 9: Check System Limits

```bash
# Check file descriptor limits
ulimit -n

# Increase if needed
ulimit -n 65536
```

## Common Ubuntu Issues

### Port Already in Use

```bash
# Find process using port 3001
sudo lsof -i :3001
# or
sudo fuser 3001/tcp

# Kill the process
sudo kill -9 <PID>
```

### Permission Denied on Logs Directory

```bash
# Create logs directory with proper permissions
mkdir -p logs
chmod 755 logs
```

### PM2 Not Starting on Boot

```bash
# Re-run startup command
pm2 startup
# Follow the instructions it outputs
```

## Quick Fix Commands

```bash
# Stop all PM2 processes
pm2 kill

# Remove old process
pm2 delete performance-frontend

# Rebuild
npm run build

# Start fresh
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs performance-frontend
```

