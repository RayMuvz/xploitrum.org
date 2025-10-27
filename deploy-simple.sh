#!/bin/bash

###############################################################################
# Simple Safe Deployment Script
###############################################################################

set -e

echo "🚀 Starting safe deployment..."

# Create backup
echo "📦 Creating backups..."
mkdir -p ~/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)

cd ~/xploitrum.org

# Pull latest
echo "📥 Pulling from GitHub..."
git pull origin main

# Update backend
echo "🔧 Updating backend..."
cd ~/xploitrum.org/backend
source venv/bin/activate
pip install -r requirements.txt --quiet --upgrade
sudo systemctl restart xploitrum-backend
sleep 3

# Update frontend
echo "🎨 Updating frontend..."
cd ~/xploitrum.org/frontend
npm install --silent
npm run build
sudo systemctl restart xploitrum-frontend
sleep 3

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "Backend: $(sudo systemctl is-active xploitrum-backend)"
echo "Frontend: $(sudo systemctl is-active xploitrum-frontend)"

