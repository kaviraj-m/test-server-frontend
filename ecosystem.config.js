const path = require('path');

module.exports = {
  apps: [
    {
      name: 'performance-frontend',
      script: path.join(__dirname, 'start-server.js'),
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
      },
      error_file: path.join(__dirname, 'logs/err.log'),
      out_file: path.join(__dirname, 'logs/out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};

