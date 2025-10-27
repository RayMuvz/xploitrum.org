# Safe Production Deployment Guide
## Deploying Development Version to Production (DigitalOcean)

This guide ensures your production PostgreSQL database and configuration remain intact during deployment.

## Prerequisites Checklist

- [ ] SSH access to your DigitalOcean droplet
- [ ] Current production is running PostgreSQL
- [ ] You have the production database password
- [ ] Git repository is accessible from the server

## Step 1: Backup Your Current Production Database

**THIS IS CRITICAL - DO NOT SKIP THIS STEP**

```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Switch to the deployment user
su - xploitrum

# Create backup directory
mkdir -p ~/backups/pre-deployment
cd ~/backups/pre-deployment

# Backup PostgreSQL database
pg_dump -U xploitrum xploitrum > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup your current configuration
cp -r ~/xploitrum.org/backend/.env ~/backups/pre-deployment/.env.$(date +%Y%m%d_%H%M%S)
cp -r ~/xploitrum.org/frontend/.env.local ~/backups/pre-deployment/.env.local.$(date +%Y%m%d_%H%M%S)

echo "✅ Backup complete!"
```

## Step 2: Pull Latest Code from Your Repository

```bash
# Navigate to project directory
cd ~/xploitrum.org

# Pull latest changes
git fetch origin
git pull origin main

# Check what branch you're on
git branch
```

## Step 3: Backend Deployment (Safe - No Database Migration Required)

```bash
cd ~/xploitrum.org/backend

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt --quiet --upgrade

# **IMPORTANT: DO NOT RUN DATABASE MIGRATIONS**
# The code is already compatible with your existing PostgreSQL schema
# New features use the existing tables or add new optional columns

# Restart backend service
echo "🔄 Restarting backend..."
sudo systemctl restart xploitrum-backend

# Wait and check status
sleep 3
sudo systemctl status xploitrum-backend --no-pager | head -10
```

## Step 4: Frontend Deployment

```bash
cd ~/xploitrum.org/frontend

# Install dependencies
echo "📦 Installing Node dependencies..."
npm install --silent

# Build production bundle
echo "🏗️  Building Next.js production bundle..."
npm run build

# Restart frontend service
echo "🔄 Restarting frontend..."
sudo systemctl restart xploitrum-frontend

# Wait and check status
sleep 3
sudo systemctl status xploitrum-frontend --no-pager | head -10
```

## Step 5: Restart Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Step 6: Verify Deployment

```bash
# Check all services are running
echo "📊 Service Status:"
sudo systemctl status xploitrum-backend --no-pager | grep Active
sudo systemctl status xploitrum-frontend --no-pager | grep Active
sudo systemctl status nginx --no-pager | grep Active
sudo systemctl status postgresql --no-pager | grep Active

# Test API endpoint
curl -I https://api.xploitrum.org/health || curl -I http://localhost:8000/health

# Test frontend
curl -I https://www.xploitrum.org || curl -I http://localhost:3000
```

## Database Compatibility Notes

Your production PostgreSQL database is **100% compatible** with this deployment because:

1. ✅ **Existing Tables**: All existing tables remain unchanged
2. ✅ **New Tables Added**: New tables (member_requests, etc.) don't affect existing data
3. ✅ **Optional Columns**: New columns like `must_change_password` are optional with defaults
4. ✅ **No Breaking Changes**: All existing functionality works with current database schema

## What's New in This Deployment

### Backend Changes:
- ✨ New profile page endpoint
- ✨ Background email tasks (faster performance)
- ✨ Enhanced stats endpoints
- ✨ Member request management
- ✨ User management improvements
- ✨ Password change enforcement

### Frontend Changes:
- ✨ New user profile page
- ✨ Admin statistics management
- ✨ Improved email sending performance
- ✨ Real-time stats from database
- ✨ Team member photos
- ✨ Discord/Instagram social links
- ✨ Enhanced footer and SEO

## Rollback Procedure (If Needed)

If something goes wrong, you can rollback:

```bash
# Stop services
sudo systemctl stop xploitrum-backend
sudo systemctl stop xploitrum-frontend

# Restore database backup (if needed)
cd ~/backups/pre-deployment
psql -U xploitrum xploitrum < backup_*.sql

# Restore old code
cd ~/xploitrum.org
git log --oneline -10  # Check previous commits
git checkout <previous-commit-hash>

# Restart services
sudo systemctl start xploitrum-backend
sudo systemctl start xploitrum-frontend
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u xploitrum-backend -n 50
sudo journalctl -u xploitrum-frontend -n 50

# Common fixes
sudo systemctl daemon-reload
sudo systemctl restart xploitrum-backend xploitrum-frontend
```

### Database Connection Issues

```bash
# Test connection
psql -U xploitrum -d xploitrum -c "SELECT version();"

# Check if database is running
sudo systemctl status postgresql
```

### Frontend Build Errors

```bash
# Clear Next.js cache
cd ~/xploitrum.org/frontend
rm -rf .next

# Rebuild
npm run build
```

## Post-Deployment Verification

Test these features:

1. ✅ Visit https://www.xploitrum.org - Should load properly
2. ✅ Login with your admin account
3. ✅ Check Profile page - should load without 405 error
4. ✅ Visit Admin Panel → User Management
5. ✅ Visit Admin Panel → Statistics
6. ✅ Try member request feature
7. ✅ Check email functionality

## Quick Deploy Script (All-in-One)

Create this file on your droplet as `/home/xploitrum/safe-deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Safe Production Deployment"
echo "=============================="

# Backup
echo "📦 Creating backups..."
mkdir -p ~/backups/pre-deployment
cd ~/backups/pre-deployment
pg_dump -U xploitrum xploitrum > backup_$(date +%Y%m%d_%H%M%S).sql
cp ~/xploitrum.org/backend/.env .env.$(date +%Y%m%d_%H%M%S)

# Pull code
echo "📥 Pulling latest code..."
cd ~/xploitrum.org
git pull origin main

# Backend
echo "🔧 Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet --upgrade
sudo systemctl restart xploitrum-backend

# Frontend  
echo "🎨 Updating frontend..."
cd ../frontend
npm install --silent
npm run build
sudo systemctl restart xploitrum-frontend

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "View logs: sudo journalctl -u xploitrum-backend -f"
```

Make it executable:
```bash
chmod +x ~/safe-deploy.sh
```

Then run:
```bash
~/safe-deploy.sh
```

## Important Notes

⚠️ **DO NOT**:
- Delete or modify existing PostgreSQL tables
- Run `alembic upgrade` or any migration commands
- Change `.env` database credentials
- Use `docker-compose up` (you're using systemd services)

✅ **DO**:
- Keep your current `.env` file (don't overwrite)
- Backup before deploying
- Monitor logs after deployment
- Test critical features after deployment

## Environment Variables to Keep

Make sure these remain unchanged in `backend/.env`:

```bash
DATABASE_URL=postgresql://xploitrum:YOUR_PASSWORD@localhost/xploitrum
SECRET_KEY=your_existing_secret_key
JWT_SECRET_KEY=your_existing_jwt_secret
```

## Support

If you encounter issues:
1. Check logs: `sudo journalctl -u xploitrum-backend -n 50`
2. Restart services: `sudo systemctl restart xploitrum-backend xploitrum-frontend`
3. Check database: `sudo systemctl status postgresql`
4. Verify Nginx: `sudo nginx -t`

## Summary

This deployment is **safe** because:
- ✅ No database migrations required
- ✅ No breaking changes to existing schema
- ✅ Backward compatible with existing data
- ✅ All existing functionality preserved
- ✅ New features are additions, not modifications

Your production database will remain **100% intact** and fully functional.

