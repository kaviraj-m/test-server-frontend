// PM2 start script for Next.js
process.argv = ['node', 'next', 'start', '-p', '3001', '-H', '0.0.0.0'];
require('next/dist/bin/next');

