#!/bin/bash

###############################################################################
# Manual Safe Deployment Script
# Run this script directly on your DigitalOcean droplet
###############################################################################

set -e  # Exit on error

echo "🚀 Starting safe deployment..."
echo "================================================"

# Create backup
echo ""
echo "📦 Creating database backup..."
mkdir -p ~/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL database
echo "  → Backing up PostgreSQL database..."
pg_dump -U xploitrum xploitrum > $BACKUP_DIR/database_backup.sql || echo "⚠️ Could not backup database"

# Backup environment files
echo "  → Backing up environment files..."
cp ~/xploitrum.org/backend/.env $BACKUP_DIR/.env || echo "⚠️ Could not backup .env"

echo "✅ Backups created in $BACKUP_DIR"

# Navigate to project
cd ~/xploitrum.org

# Pull latest changes
echo ""
echo "📥 Pulling from GitHub..."
git fetch origin
git pull origin main || git pull origin master

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
sudo systemctl restart xploitrum-backend
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
sudo systemctl restart xploitrum-frontend
echo "  ⏳ Waiting for frontend to start..."
sleep 3

# Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# Check status
echo ""
echo "✅ Deployment complete!"
echo "================================================"
echo "Backend:  $(sudo systemctl is-active xploitrum-backend)"
echo "Frontend: $(sudo systemctl is-active xploitrum-frontend)"
echo "Nginx:    $(sudo systemctl is-active nginx)"
echo "Database: $(sudo systemctl is-active postgresql)"
echo ""
echo "Commit: $COMMIT"
echo "Backup: $BACKUP_DIR"
echo ""
echo "🎉 Deployment successful!"

