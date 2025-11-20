#!/bin/bash
# Combined startup script for Railway deployment
# Runs Prisma migrations, then starts API server and indexer in parallel

set -e  # Exit on error

echo "🚀 Starting Sui Patreon Backend (API + Indexer)"
echo "================================================"

# 1. Run database migrations
echo "📊 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Database migrations completed successfully"
else
  echo "❌ Database migration failed"
  exit 1
fi

# 2. Generate Prisma client (in case it's not already generated)
echo "🔧 Generating Prisma client..."
npx prisma generate

# 3. Test database connectivity
echo "🔌 Testing database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
    prisma.\$disconnect();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"

# 4. Start API server and indexer in parallel using Node.js
echo "🌐 Starting API server and indexer..."
echo "================================================"

# Use node to run both processes
node -e "
const { spawn } = require('child_process');

// Start API server
const api = spawn('node', ['src/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

// Start indexer
const indexer = spawn('node', ['src/indexer.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ Received SIGTERM, shutting down gracefully...');
  api.kill('SIGTERM');
  indexer.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('⚠️ Received SIGINT, shutting down gracefully...');
  api.kill('SIGINT');
  indexer.kill('SIGINT');
});

// Exit if either process exits
api.on('exit', (code) => {
  console.error('❌ API server exited with code', code);
  indexer.kill();
  process.exit(code || 1);
});

indexer.on('exit', (code) => {
  console.error('❌ Indexer exited with code', code);
  api.kill();
  process.exit(code || 1);
});
"
