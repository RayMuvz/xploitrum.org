#!/bin/bash
# Manual deployment script for XploitRUM
# Run this script on your droplet: ./manual-deploy.sh

set -e
echo "🚀 Starting manual deployment..."

# Backup database
echo "📦 Creating database backup..."
mkdir -p ~/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump xploitrum > $BACKUP_DIR/database_backup.sql || echo "⚠️ Could not backup database"
cp ~/xploitrum.org/backend/.env $BACKUP_DIR/.env || echo "⚠️ Could not backup .env"

echo "✅ Backups created in $BACKUP_DIR"

# Navigate to project
cd ~/xploitrum.org

# Pull latest changes
echo "📥 Pulling from GitHub..."
git fetch origin
git pull origin main || git pull origin master

# Get commit info
COMMIT=$(git rev-parse --short HEAD)
echo "📦 Deployed commit: $COMMIT"

# Update backend
echo "🔧 Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet --upgrade

# Run database migrations
echo "🔧 Running database migrations..."
python add_must_change_password_column.py || echo "⚠️ Column may already exist"
python create_member_requests_table.py || echo "⚠️ Table may already exist"

# Restart backend
sudo systemctl restart xploitrum-backend
echo "⏳ Waiting for backend to start..."
sleep 3

# Update frontend
echo "🎨 Updating frontend..."
cd ../frontend
npm install --silent
npm run build

# Restart frontend
sudo systemctl restart xploitrum-frontend
echo "⏳ Waiting for frontend to start..."
sleep 3

# Reload Nginx
sudo systemctl reload nginx

# Check status
echo "✅ Deployment complete!"
echo "Backend: $(sudo systemctl is-active xploitrum-backend)"
echo "Frontend: $(sudo systemctl is-active xploitrum-frontend)"
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "PostgreSQL: $(sudo systemctl is-active postgresql)"

