# Quick Start Guide

## 🚀 Deploy to DigitalOcean in 3 Steps

### Step 1: Server Setup (One-time)

SSH to your droplet as root and run:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/xploitrum.org/main/scripts/initial-server-setup.sh | bash
```

### Step 2: Configure & Deploy

Switch to xploitrum user and follow the setup:

```bash
su - xploitrum

# Generate SSH key
ssh-keygen -t ed25519 -C "admin@xploitrum.org"
cat ~/.ssh/id_ed25519.pub
# Add this key to GitHub

# Clone repository
git clone git@github.com:YOUR_USERNAME/xploitrum.org.git
cd xploitrum.org

# Setup database
sudo -u postgres psql << EOF
CREATE DATABASE xploitrum;
CREATE USER xploitrum WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE xploitrum TO xploitrum;
\q
EOF

# Configure backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and edit .env
cp env.example.txt .env
nano .env  # Update DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY, SMTP settings

# Initialize database
python -c "from app.core.database import init_db; init_db()"

# Create admin user
python -c "
from app.core.database import SessionLocal
from app.services.auth_service import auth_service

db = SessionLocal()
admin = auth_service.register_user(db, {
    'username': 'admin',
    'email': 'admin@xploitrum.org',
    'password': 'xploitRUM2025',
    'full_name': 'Admin User'
})
admin.role = 'admin'
db.commit()
print('✅ Admin user created!')
"

# Build frontend
cd ../frontend
npm install
echo "NEXT_PUBLIC_API_URL=https://api.xploitrum.org" > .env.local
npm run build

# Setup services (see DEPLOYMENT.md Part 7)
# Setup Nginx (see DEPLOYMENT.md Part 8)
# Setup SSL (see DEPLOYMENT.md Part 9)
```

### Step 3: Enable Auto-Deploy

Add GitHub secrets (GitHub repo → Settings → Secrets → Actions):
- `DROPLET_IP`: Your droplet IP
- `SSH_PRIVATE_KEY`: Contents of `~/.ssh/id_ed25519` from droplet

Now every `git push` to main will auto-deploy! 🎉

## 📝 Daily Workflow

### From Your Local Machine

```bash
# Make changes
code .

# Test locally
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
cd frontend && npm run dev

# Commit and push
git add .
git commit -m "Your changes"
git push origin main

# ✨ Auto-deploys to production in 2-3 minutes!
```

## 🔧 Common Commands

### On Server

```bash
# View logs
sudo journalctl -u xploitrum-backend -f
sudo journalctl -u xploitrum-frontend -f

# Restart services
sudo systemctl restart xploitrum-backend xploitrum-frontend

# Manual deploy
/home/xploitrum/deploy.sh

# Check status
sudo systemctl status xploitrum-backend xploitrum-frontend nginx
```

### Local Development

```bash
# Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev

# Both together (Windows PowerShell)
# Terminal 1: cd backend; venv\Scripts\activate; uvicorn app.main:app --reload
# Terminal 2: cd frontend; npm run dev
```

## 🎯 URLs

- **Production**: https://www.xploitrum.org
- **API**: https://api.xploitrum.org
- **API Docs**: https://api.xploitrum.org/docs
- **Admin**: https://www.xploitrum.org/admin
- **CTF Platform**: https://www.xploitrum.org/ctf-platform

## ⚡ Need Help?

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

