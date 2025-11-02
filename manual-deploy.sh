#!/bin/bash
# Manual deployment script for XploitRUM
# Run this script on your droplet: ./manual-deploy.sh
#
# Note: Ensure Shopify environment variables are set in production .env:
#   - SHOPIFY_STORE_URL=shop.xploitrum.org
#   - SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token
#   - SHOPIFY_COLLECTION_ID=your_collection_id

set -e
echo "🚀 Starting manual deployment..."

# Backup database
echo "📦 Creating database backup..."
mkdir -p /root/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/root/backups/pre-deployment-$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump xploitrum > $BACKUP_DIR/database_backup.sql || echo "⚠️ Could not backup database"
cp /home/xploitrum.org/backend/.env $BACKUP_DIR/.env 2>/dev/null || echo "⚠️ Could not backup .env"

echo "✅ Backups created in $BACKUP_DIR"

# Navigate to project
cd /home/xploitrum.org

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

# Ensure production environment variables are set
echo "🔧 Checking frontend environment variables..."
if [ ! -f ".env.production" ]; then
    echo "⚠️  WARNING: frontend/.env.production not found!"
    echo "Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        echo "✅ Created .env.production from .env.example"
        echo "⚠️  IMPORTANT: Edit frontend/.env.production and add your Shopify credentials!"
        echo "   Required variables:"
        echo "   - NEXT_PUBLIC_SHOPIFY_STORE_URL"
        echo "   - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN"
        echo "   - NEXT_PUBLIC_SHOPIFY_COLLECTION_ID"
    else
        echo "❌ .env.example not found!"
    fi
fi

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