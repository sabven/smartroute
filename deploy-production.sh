#!/bin/bash

# SmartRoute Production Deployment Script
# For handling 1000+ rides per day

echo "🚀 Starting SmartRoute Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="smartroute"
SERVER_PORT=5000
CLIENT_PORT=3000

# Function to check if a service is running
check_service() {
    if pgrep -f "$1" > /dev/null; then
        echo -e "${GREEN}✅ $1 is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not running${NC}"
        return 1
    fi
}

# Function to start service with PM2
start_service() {
    local name=$1
    local script=$2
    local cwd=$3
    
    echo -e "${YELLOW}Starting $name...${NC}"
    cd "$cwd"
    pm2 start "$script" --name "$name" --instances max --merge-logs
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL service first"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd server && npm ci --production
cd ../client && npm ci

# Build client for production
echo "🏗️ Building client for production..."
npm run build

# Database setup
echo "🗄️ Setting up database..."
cd ../server
npm run db:migrate 2>/dev/null || echo "Migrations already applied"

# Copy production environment
if [ -f "../.env.production" ]; then
    cp ../.env.production .env
    echo -e "${GREEN}✅ Production environment configured${NC}"
fi

# Stop existing services
echo "🛑 Stopping existing services..."
pm2 stop $PROJECT_NAME-server 2>/dev/null || true
pm2 stop $PROJECT_NAME-client 2>/dev/null || true

# Start services with PM2
echo "🚀 Starting services..."

# Start server
start_service "${PROJECT_NAME}-server" "src/server-postgres.js" "$(pwd)"

# Start client (if serving with Node.js)
if [ -d "../client/build" ]; then
    # Serve built client with express
    cat > serve-client.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const port = process.env.CLIENT_PORT || 3000;
app.listen(port, () => {
  console.log(`Client server running on port ${port}`);
});
EOF
    
    start_service "${PROJECT_NAME}-client" "serve-client.js" "$(pwd)"
fi

# Setup log rotation
echo "📋 Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Setup monitoring
echo "📊 Setting up monitoring..."
pm2 install pm2-server-monit 2>/dev/null || true

# Save PM2 configuration
pm2 save
pm2 startup

# Health check
echo "🔍 Performing health check..."
sleep 5

if curl -f http://localhost:$SERVER_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server health check passed${NC}"
else
    echo -e "${RED}❌ Server health check failed${NC}"
fi

# Display status
echo "📈 Service Status:"
pm2 status

echo "🎉 Deployment completed!"
echo "📊 Monitor services: pm2 monit"
echo "📋 View logs: pm2 logs"
echo "🔄 Restart services: pm2 restart all"

# Performance tips
echo ""
echo "💡 Performance Tips for 1000+ rides/day:"
echo "   - Monitor PM2 dashboard: pm2 monit"
echo "   - Check database connections: pm2 logs $PROJECT_NAME-server | grep 'Database'"
echo "   - Monitor memory usage: pm2 show $PROJECT_NAME-server"
echo "   - Setup database connection pooling in production"
echo "   - Enable Redis caching for better performance"
echo "   - Consider load balancer for multiple server instances"
