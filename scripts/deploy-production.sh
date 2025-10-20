#!/bin/bash

###############################################################################
# XploitRUM Production Deployment Script
# This script should be placed on your DigitalOcean droplet
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/xploitrum/xploitrum.org"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${BLUE}🚀 XploitRUM Production Deployment${NC}"
echo "================================================"

# Check if running as xploitrum user
if [ "$USER" != "xploitrum" ]; then
    echo -e "${RED}❌ This script must be run as xploitrum user${NC}"
    echo "Run: su - xploitrum, then run this script"
    exit 1
fi

# Pull latest changes from Git
echo -e "\n${YELLOW}📥 Pulling latest changes from Git...${NC}"
cd "$PROJECT_DIR"
git fetch origin
git pull origin main

# Get current commit
COMMIT=$(git rev-parse --short HEAD)
echo -e "${GREEN}✓ Updated to commit: $COMMIT${NC}"

# Backend deployment
echo -e "\n${YELLOW}🔧 Deploying Backend...${NC}"
cd "$BACKEND_DIR"

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "  → Installing Python dependencies..."
pip install -r requirements.txt --quiet

# Run database migrations (if using Alembic)
if [ -f "alembic.ini" ]; then
    echo "  → Running database migrations..."
    alembic upgrade head
fi

# Restart backend service
echo "  → Restarting backend service..."
sudo systemctl restart xploitrum-backend

# Check if backend started successfully
sleep 2
if sudo systemctl is-active --quiet xploitrum-backend; then
    echo -e "${GREEN}✓ Backend service started successfully${NC}"
else
    echo -e "${RED}❌ Backend service failed to start${NC}"
    sudo journalctl -u xploitrum-backend -n 20
    exit 1
fi

# Frontend deployment
echo -e "\n${YELLOW}🎨 Deploying Frontend...${NC}"
cd "$FRONTEND_DIR"

# Install/update dependencies
echo "  → Installing Node dependencies..."
npm install --silent

# Build production bundle
echo "  → Building Next.js production bundle..."
npm run build

# Restart frontend service
echo "  → Restarting frontend service..."
sudo systemctl restart xploitrum-frontend

# Check if frontend started successfully
sleep 2
if sudo systemctl is-active --quiet xploitrum-frontend; then
    echo -e "${GREEN}✓ Frontend service started successfully${NC}"
else
    echo -e "${RED}❌ Frontend service failed to start${NC}"
    sudo journalctl -u xploitrum-frontend -n 20
    exit 1
fi

# Reload Nginx
echo -e "\n${YELLOW}🔄 Reloading Nginx...${NC}"
sudo nginx -t && sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

# Clear cache (optional)
if [ -d "/var/cache/nginx" ]; then
    echo -e "\n${YELLOW}🧹 Clearing Nginx cache...${NC}"
    sudo rm -rf /var/cache/nginx/*
    echo -e "${GREEN}✓ Cache cleared${NC}"
fi

# Service status
echo -e "\n${BLUE}📊 Service Status:${NC}"
echo "Backend:  $(sudo systemctl is-active xploitrum-backend)"
echo "Frontend: $(sudo systemctl is-active xploitrum-frontend)"
echo "Nginx:    $(sudo systemctl is-active nginx)"
echo "Database: $(sudo systemctl is-active postgresql)"

# Display deployment info
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 Deployment Successful!${NC}"
echo -e "${GREEN}================================================${NC}"
echo "Commit: $COMMIT"
echo "Time: $(date)"
echo ""
echo "Website: https://www.xploitrum.org"
echo "API: https://api.xploitrum.org"
echo ""
echo -e "${BLUE}View logs:${NC}"
echo "  Backend:  sudo journalctl -u xploitrum-backend -f"
echo "  Frontend: sudo journalctl -u xploitrum-frontend -f"
echo ""

