#!/bin/bash

# XploitRUM - Restart Services Script
# This script restarts the backend and frontend services

echo "🔄 Restarting XploitRUM Services..."

# Restart backend
echo "🔧 Restarting backend service..."
sudo systemctl restart xploitrum-backend.service

# Wait a moment
sleep 2

# Check backend status
if sudo systemctl is-active --quiet xploitrum-backend.service; then
    echo "✅ Backend service restarted successfully"
else
    echo "❌ Backend service failed to restart"
    echo "📋 Backend logs:"
    sudo journalctl -u xploitrum-backend.service -n 20 --no-pager
    exit 1
fi

# Restart frontend
echo "🔧 Restarting frontend service..."
sudo systemctl restart xploitrum-frontend.service

# Wait a moment
sleep 2

# Check frontend status
if sudo systemctl is-active --quiet xploitrum-frontend.service; then
    echo "✅ Frontend service restarted successfully"
else
    echo "❌ Frontend service failed to restart"
    echo "📋 Frontend logs:"
    sudo journalctl -u xploitrum-frontend.service -n 20 --no-pager
    exit 1
fi

echo ""
echo "🎉 All services restarted successfully!"
echo ""
echo "📊 Service Status:"
sudo systemctl status xploitrum-backend.service --no-pager -l | head -3
sudo systemctl status xploitrum-frontend.service --no-pager -l | head -3
echo ""
echo "✅ Your website is now running with the latest code!"

