# XploitRUM Production Deployment Guide

This guide will help you deploy the XploitRUM platform to your DigitalOcean droplet with automatic Git updates.

## Prerequisites

- DigitalOcean Droplet (Ubuntu 22.04 LTS x64)
- Domain: xploitrum.org with DNS configured
- SSH access to your droplet

## Droplet Specifications (Recommended)

- **Minimum**: 2 GB RAM, 1 CPU, 50 GB SSD
- **Recommended**: 4 GB RAM, 2 CPUs, 80 GB SSD
- **For production**: 8 GB RAM, 4 CPUs, 160 GB SSD

## Part 1: Initial Server Setup

### 1. Connect to your droplet

```bash
ssh root@your_droplet_ip
```

### 2. Update system

```bash
apt update && apt upgrade -y
```

### 3. Create deployment user

```bash
adduser xploitrum
usermod -aG sudo xploitrum
su - xploitrum
```

## Part 2: Install Required Software

### 1. Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Install Python 3.11+

```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Install Certbot (for SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## Part 3: Setup Git Repository

### 1. Generate SSH key for GitHub

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```

Copy the output and add it to your GitHub account (Settings → SSH and GPG keys → New SSH key).

### 2. Clone repository

```bash
cd /home/xploitrum
git clone git@github.com:YOUR_USERNAME/xploitrum.org.git
cd xploitrum.org
```

## Part 4: Setup Database

### 1. Create PostgreSQL database and user

```bash
sudo -u postgres psql
```

In PostgreSQL shell:

```sql
CREATE DATABASE xploitrum;
CREATE USER xploitrum WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE xploitrum TO xploitrum;
\q
```

## Part 5: Configure Environment Variables

### 1. Backend environment

```bash
cd /home/xploitrum/xploitrum.org/backend
cp .env.example .env
nano .env
```

Update with production values:

```bash
# Database
DATABASE_URL=postgresql://xploitrum:your_secure_password@localhost/xploitrum

# Security (generate secure keys!)
SECRET_KEY=your_very_long_random_secret_key_here
JWT_SECRET_KEY=another_very_long_random_jwt_secret_key

# SMTP (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=admin@xploitrum.org
SMTP_PASSWORD=your_gmail_app_password
FROM_EMAIL=admin@xploitrum.org

# Environment
ENVIRONMENT=production
DEBUG=False

# CORS
CORS_ORIGINS=https://www.xploitrum.org,https://ctf.xploitrum.org,https://api.xploitrum.org
ALLOWED_HOSTS=www.xploitrum.org,ctf.xploitrum.org,api.xploitrum.org,xploitrum.org

# URLs
FRONTEND_URL=https://www.xploitrum.org
API_URL=https://api.xploitrum.org
```

### 2. Frontend environment

```bash
cd /home/xploitrum/xploitrum.org/frontend
nano .env.local
```

```bash
NEXT_PUBLIC_API_URL=https://api.xploitrum.org
```

## Part 6: Install Dependencies

### 1. Backend

```bash
cd /home/xploitrum/xploitrum.org/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend

```bash
cd /home/xploitrum/xploitrum.org/frontend
npm install
npm run build
```

## Part 7: Setup Systemd Services

### 1. Backend Service

```bash
sudo nano /etc/systemd/system/xploitrum-backend.service
```

```ini
[Unit]
Description=XploitRUM Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=xploitrum
WorkingDirectory=/home/xploitrum/xploitrum.org/backend
Environment="PATH=/home/xploitrum/xploitrum.org/backend/venv/bin"
ExecStart=/home/xploitrum/xploitrum.org/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Frontend Service

```bash
sudo nano /etc/systemd/system/xploitrum-frontend.service
```

```ini
[Unit]
Description=XploitRUM Frontend
After=network.target

[Service]
Type=simple
User=xploitrum
WorkingDirectory=/home/xploitrum/xploitrum.org/frontend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Enable and start services

```bash
sudo systemctl daemon-reload
sudo systemctl enable xploitrum-backend
sudo systemctl enable xploitrum-frontend
sudo systemctl start xploitrum-backend
sudo systemctl start xploitrum-frontend
```

### 4. Check service status

```bash
sudo systemctl status xploitrum-backend
sudo systemctl status xploitrum-frontend
```

## Part 8: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/xploitrum.org
```

```nginx
# Main website (www.xploitrum.org)
server {
    listen 80;
    server_name www.xploitrum.org xploitrum.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API subdomain (api.xploitrum.org)
server {
    listen 80;
    server_name api.xploitrum.org;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# CTF subdomain (ctf.xploitrum.org) - redirects to main site
server {
    listen 80;
    server_name ctf.xploitrum.org;
    return 301 https://www.xploitrum.org/ctf-platform$request_uri;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/xploitrum.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Part 9: Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d www.xploitrum.org -d xploitrum.org -d api.xploitrum.org -d ctf.xploitrum.org
```

Follow the prompts and choose option 2 (Redirect HTTP to HTTPS).

## Part 10: Auto-Deploy from Git (CI/CD)

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.DROPLET_IP }}
        username: xploitrum
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /home/xploitrum/xploitrum.org
          git pull origin main
          
          # Update backend
          cd backend
          source venv/bin/activate
          pip install -r requirements.txt
          sudo systemctl restart xploitrum-backend
          
          # Update frontend
          cd ../frontend
          npm install
          npm run build
          sudo systemctl restart xploitrum-frontend
          
          echo "✅ Deployment complete!"
```

Add secrets to GitHub repository (Settings → Secrets → Actions):
- `DROPLET_IP`: Your droplet IP address
- `SSH_PRIVATE_KEY`: Your SSH private key

### Option B: Manual Deploy Script

Create a deploy script on the server:

```bash
nano /home/xploitrum/deploy.sh
```

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

cd /home/xploitrum/xploitrum.org

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Update backend
echo "🔧 Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet
sudo systemctl restart xploitrum-backend

# Update frontend
echo "🎨 Updating frontend..."
cd ../frontend
npm install --silent
npm run build
sudo systemctl restart xploitrum-frontend

# Check service status
echo "✅ Checking services..."
sudo systemctl status xploitrum-backend --no-pager | head -3
sudo systemctl status xploitrum-frontend --no-pager | head -3

echo "🎉 Deployment complete!"
```

Make it executable:

```bash
chmod +x /home/xploitrum/deploy.sh
```

### Option C: Git Post-Receive Hook (Auto-deploy on push)

On your server:

```bash
cd /home/xploitrum/xploitrum.org
git config --local receive.denyCurrentBranch ignore

nano .git/hooks/post-receive
```

```bash
#!/bin/bash

echo "🚀 Post-receive hook triggered..."
cd /home/xploitrum/xploitrum.org
git checkout -f

# Run deployment script
/home/xploitrum/deploy.sh
```

Make it executable:

```bash
chmod +x .git/hooks/post-receive
```

Then from your local machine, add the droplet as a remote:

```bash
git remote add production xploitrum@your_droplet_ip:/home/xploitrum/xploitrum.org
git push production main
```

## Part 11: Database Migrations

Initialize the database:

```bash
cd /home/xploitrum/xploitrum.org/backend
source venv/bin/activate
python -c "from app.core.database import init_db; init_db()"
```

Create admin user:

```bash
python -c "
from app.core.database import SessionLocal
from app.services.auth_service import auth_service

db = SessionLocal()
user_data = {
    'username': 'admin',
    'email': 'admin@xploitrum.org',
    'password': 'your_secure_admin_password',
    'full_name': 'Admin User'
}
admin = auth_service.register_user(db, user_data)
admin.role = 'admin'
db.commit()
print('Admin user created!')
db.close()
"
```

## Part 12: Monitoring & Logs

### View logs

```bash
# Backend logs
sudo journalctl -u xploitrum-backend -f

# Frontend logs
sudo journalctl -u xploitrum-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitor services

```bash
# Check if services are running
systemctl status xploitrum-backend
systemctl status xploitrum-frontend
systemctl status nginx
systemctl status postgresql
```

## Part 13: Firewall Setup

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Part 14: Performance Optimization

### Enable Nginx caching

Add to your Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    # ... rest of proxy config
}
```

### Setup log rotation

```bash
sudo nano /etc/logrotate.d/xploitrum
```

```
/var/log/xploitrum/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 xploitrum xploitrum
    sharedscripts
}
```

## Part 15: Backup Strategy

### Database backups

```bash
# Create backup script
nano /home/xploitrum/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/xploitrum/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U xploitrum xploitrum > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads and data
tar -czf $BACKUP_DIR/data_backup_$DATE.tar.gz /home/xploitrum/xploitrum.org/backend/uploads

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab:

```bash
chmod +x /home/xploitrum/backup.sh
crontab -e
```

Add line:

```
0 2 * * * /home/xploitrum/backup.sh
```

## Deployment Workflow

### Method 1: Push from Local → Auto-Deploy (GitHub Actions)

1. Make changes locally
2. Commit: `git commit -am "Your changes"`
3. Push: `git push origin main`
4. GitHub Actions automatically deploys to droplet
5. Changes live in ~2-3 minutes

### Method 2: Manual Deploy

1. Make changes locally
2. Commit: `git commit -am "Your changes"`
3. Push to GitHub: `git push origin main`
4. SSH to droplet: `ssh xploitrum@your_droplet_ip`
5. Run: `/home/xploitrum/deploy.sh`

### Method 3: Direct Push to Droplet

1. Make changes locally
2. Commit: `git commit -am "Your changes"`
3. Push directly: `git push production main`
4. Auto-deploys via post-receive hook

## Troubleshooting

### Services not starting

```bash
# Check logs
sudo journalctl -u xploitrum-backend -n 50
sudo journalctl -u xploitrum-frontend -n 50

# Restart services
sudo systemctl restart xploitrum-backend
sudo systemctl restart xploitrum-frontend
```

### Database connection issues

```bash
# Test connection
psql -U xploitrum -d xploitrum -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Nginx issues

```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated secure SECRET_KEY and JWT_SECRET_KEY
- [ ] Configured firewall (UFW)
- [ ] Setup SSL certificates
- [ ] Disabled root SSH login
- [ ] Setup fail2ban for brute force protection
- [ ] Regular backups enabled
- [ ] Updated all packages

## Quick Commands Reference

```bash
# Deploy updates
/home/xploitrum/deploy.sh

# View backend logs
sudo journalctl -u xploitrum-backend -f

# View frontend logs
sudo journalctl -u xploitrum-frontend -f

# Restart services
sudo systemctl restart xploitrum-backend xploitrum-frontend

# Check service status
sudo systemctl status xploitrum-backend xploitrum-frontend nginx

# Update SSL certificates
sudo certbot renew
```

## DNS Configuration (Cloudflare)

Point these domains to your droplet IP:

- `A` record: `@` → Your_Droplet_IP
- `A` record: `www` → Your_Droplet_IP
- `A` record: `api` → Your_Droplet_IP
- `A` record: `ctf` → Your_Droplet_IP
- `A` record: `lab` → Your_Droplet_IP
- `A` record: `vpn` → Your_Droplet_IP

Enable Cloudflare proxy (orange cloud) for all except `vpn`.

## Post-Deployment

1. Visit https://www.xploitrum.org
2. Login to admin panel
3. Create initial challenges
4. Configure OpenVPN (if needed)
5. Test all functionality

## Support

For issues, contact: admin@xploitrum.org
