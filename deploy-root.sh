#!/bin/bash

###############################################################################
# Safe Deployment Script (Run as root from /home/xploitrum.org)
###############################################################################

set -e

echo "🚀 Starting safe deployment..."
echo "================================================"

# Navigate to project (already in correct directory)
cd /home/xploitrum.org

# Pull latest changes
echo ""
echo "📥 Pulling from GitHub..."
git pull origin main

# Get commit info
COMMIT=$(git rev-parse --short HEAD)
echo "📦 Deployed commit: $COMMIT"

# Update backend
echo ""
echo "🔧 Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet --upgrade

echo "ℹ️ Skipping database migrations (code is backward compatible)"

# Restart backend
echo "  → Restarting backend service..."
systemctl restart xploitrum-backend
echo "  ⏳ Waiting for backend to start..."
sleep 3

# Update frontend
echo ""
echo "🎨 Updating frontend..."
cd ../frontend
npm install --silent
npm run build

# Restart frontend
echo "  → Restarting frontend service..."
systemctl restart xploitrum-frontend
echo "  ⏳ Waiting for frontend to start..."
sleep 3

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Check status
echo ""
echo "✅ Deployment complete!"
echo "================================================"
echo "Backend:  $(systemctl is-active xploitrum-backend)"
echo "Frontend: $(systemctl is-active xploitrum-frontend)"
echo "Nginx:    $(systemctl is-active nginx)"
echo "Database: $(systemctl is-active postgresql)"
echo ""
echo "Commit: $COMMIT"
echo ""
echo "🎉 Deployment successful!"

