#!/bin/bash

echo "🚀 Starting SmartRoute Corporate Cab Booking Demo"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 SmartRoute Demo Information${NC}"
echo "=================================="
echo "🏢 System: Corporate Cab Booking for Indian Companies"
echo "🎯 Purpose: Employee transportation management"
echo "💻 Tech: React + Node.js + PostgreSQL"
echo ""

echo -e "${YELLOW}👥 Demo Credentials:${NC}"
echo "   Employee: priya@techcorp.com / emp123"
echo "   Driver:   rajesh@smartroute.com / driver123"
echo "   Admin:    admin@techcorp.com / admin123"
echo ""

echo -e "${YELLOW}✨ Key Features:${NC}"
echo "   • Home ↔ Office trip booking"
echo "   • Driver notifications & tracking"  
echo "   • Company admin dashboard"
echo "   • Role-based access control"
echo "   • Mobile-first responsive design"
echo "   • Real-time trip management"
echo ""

echo -e "${BLUE}🌐 Local URLs:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/api/demo"
echo ""

echo -e "${GREEN}Starting servers...${NC}"
echo ""

# Start backend in background
echo "🔧 Starting backend server..."
cd server && node demo-server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd ../client && npm start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT