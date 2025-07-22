#!/bin/bash

echo "🚀 Starting SmartRoute Application..."
echo "=================================="

# Kill any existing processes on ports 3000 and 8000
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    npm install
fi

# Start server in background
echo "🖥️  Starting server..."
cd ../server
nohup npm start > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Server started successfully at http://localhost:8000"
else
    echo "❌ Server failed to start. Check server/server.log for details."
    exit 1
fi

# Start client
echo "🌐 Starting client..."
cd ../client
echo "✅ Client starting at http://localhost:3000"
echo ""
echo "🔐 Demo credentials:"
echo "   Employee: priya@techcorp.com / emp123"
echo "   Driver: rajesh@smartroute.com / driver123"
echo "   Admin: admin@techcorp.com / admin123"
echo ""
echo "Press Ctrl+C to stop the application"

# Start client (this will keep the script running)
npm start