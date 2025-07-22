#!/bin/bash

echo "🛑 Stopping SmartRoute Services..."
echo "================================"

# Stop PM2 processes
./node_modules/.bin/pm2 stop all 2>/dev/null || true
./node_modules/.bin/pm2 delete all 2>/dev/null || true

# Kill any remaining processes on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped"