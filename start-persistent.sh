#!/bin/bash

echo "🚀 Starting SmartRoute with PM2 (Persistent Mode)"
echo "================================================"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Stop PM2 processes if running
./node_modules/.bin/pm2 stop all 2>/dev/null || true
./node_modules/.bin/pm2 delete all 2>/dev/null || true

# Wait for cleanup
sleep 2

# Install dependencies if needed
echo "📦 Checking dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

cd ../client
if [ ! -d "node_modules" ]; then
    echo "Installing client dependencies..."
    npm install
fi

cd ..

# Start with PM2
echo "🚀 Starting applications with PM2..."
./node_modules/.bin/pm2 start ecosystem.config.js

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check status
echo "📊 Service Status:"
./node_modules/.bin/pm2 status

# Test server
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Server: http://localhost:8000 (Running)"
else
    echo "❌ Server: Failed to start"
fi

# Check client
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Client: http://localhost:3000 (Running)"
else
    echo "⏳ Client: Starting up (may take a moment)"
fi

echo ""
echo "🔐 Demo Credentials:"
echo "   Employee: priya@techcorp.com / emp123"
echo "   Driver: rajesh@smartroute.com / driver123"
echo "   Admin: admin@techcorp.com / admin123"
echo ""
echo "📋 Useful Commands:"
echo "   View logs: ./node_modules/.bin/pm2 logs"
echo "   Stop all:  ./node_modules/.bin/pm2 stop all"
echo "   Restart:   ./node_modules/.bin/pm2 restart all"
echo "   Status:    ./node_modules/.bin/pm2 status"