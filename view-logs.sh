#!/bin/bash

echo "📊 SmartRoute Logs Viewer"
echo "========================="
echo ""
echo "Choose log type to view:"
echo "1. Combined logs (all)"
echo "2. Error logs"
echo "3. Access logs"  
echo "4. PM2 server logs"
echo "5. PM2 client logs"
echo "6. Live tail combined"
echo "7. Live tail PM2 server"
echo "8. Live tail PM2 client"
echo ""
read -p "Enter choice (1-8): " choice

case $choice in
  1)
    echo "📋 Combined Logs:"
    echo "-----------------"
    tail -n 50 server/logs/combined-*.log 2>/dev/null || echo "No combined logs found"
    ;;
  2)
    echo "❌ Error Logs:"
    echo "---------------"
    tail -n 50 server/logs/error-*.log 2>/dev/null || echo "No error logs found"
    ;;
  3)
    echo "🔗 Access Logs:"
    echo "----------------"
    tail -n 50 server/logs/access-*.log 2>/dev/null || echo "No access logs found"
    ;;
  4)
    echo "🖥️  PM2 Server Logs:"
    echo "--------------------"
    ./node_modules/.bin/pm2 logs smartroute-server --lines 50 --nostream
    ;;
  5)
    echo "🌐 PM2 Client Logs:"
    echo "--------------------"
    ./node_modules/.bin/pm2 logs smartroute-client --lines 50 --nostream
    ;;
  6)
    echo "👁️  Live Combined Logs (Ctrl+C to exit):"
    echo "-----------------------------------------"
    tail -f server/logs/combined-*.log 2>/dev/null || echo "No combined logs found"
    ;;
  7)
    echo "👁️  Live PM2 Server Logs (Ctrl+C to exit):"
    echo "-------------------------------------------"
    ./node_modules/.bin/pm2 logs smartroute-server
    ;;
  8)
    echo "👁️  Live PM2 Client Logs (Ctrl+C to exit):"
    echo "-------------------------------------------"
    ./node_modules/.bin/pm2 logs smartroute-client
    ;;
  *)
    echo "Invalid choice"
    ;;
esac