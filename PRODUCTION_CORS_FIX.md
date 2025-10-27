# Fix CORS and 502 Bad Gateway Error in Production

## Issue
Login fails with CORS error and 502 Bad Gateway, indicating backend isn't running properly.

## Quick Fix - Run These Commands on Your Server

```bash
# 1. Check if backend is running
systemctl status xploitrum-backend

# 2. Check backend logs for errors
journalctl -u xploitrum-backend -n 100 --no-pager

# 3. If service is not running, start it
systemctl start xploitrum-backend

# 4. If it fails to start, check for Python errors
cd ~/xploitrum.org/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# This will show any errors preventing startup
```

## Most Likely Issues

### Issue 1: Missing .env File
```bash
# Check if .env exists
ls -la ~/xploitrum.org/backend/.env

# If missing, copy from example
cd ~/xploitrum.org/backend
cp env.example.txt .env

# Edit with production values
nano .env
```

### Issue 2: PostgreSQL Connection Issue
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test database connection
psql -U xploitrum -d xploitrum -c "SELECT version();"
```

### Issue 3: CORS Configuration
Edit `backend/.env` and ensure these are set:

```bash
CORS_ORIGINS=https://www.xploitrum.org,https://xploitrum.org,https://api.xploitrum.org
ALLOWED_HOSTS=www.xploitrum.org,xploitrum.org,api.xploitrum.org,localhost
```

## Complete Restart Sequence

```bash
# Stop services
systemctl stop xploitrum-backend xploitrum-frontend

# Start backend
cd ~/xploitrum.org/backend
source venv/bin/activate
systemctl start xploitrum-backend

# Wait a moment
sleep 3

# Check status
systemctl status xploitrum-backend

# Start frontend
cd ~/xploitrum.org/frontend
systemctl start xploitrum-frontend

# Check both
systemctl status xploitrum-backend xploitrum-frontend
```

## Test Backend Manually

```bash
# SSH to your server
ssh root@your_droplet_ip

# Test backend directly
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

If you get an error, check the logs:
```bash
journalctl -u xploitrum-backend -f
```

## Common Solutions

### If backend won't start:
```bash
# Check virtual environment
cd ~/xploitrum.org/backend
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt --upgrade

# Try starting manually to see error
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### If CORS errors persist:
Add these to `backend/.env`:
```bash
CORS_ORIGINS=https://www.xploitrum.org,https://xploitrum.org,https://api.xploitrum.org,https://ctf.xploitrum.org
ALLOWED_HOSTS=www.xploitrum.org,xploitrum.org,api.xploitrum.org,ctf.xploitrum.org,localhost,127.0.0.1
```

Then restart backend:
```bash
systemctl restart xploitrum-backend
```

## Verify Backend is Working

After fixing, test:
```bash
# Should return: {"status":"ok"}
curl http://localhost:8000/health

# Should return API info
curl http://localhost:8000/api/v1/
```

Once backend is responding, the CORS error will be resolved.

