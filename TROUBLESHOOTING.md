# 🔧 XploitRUM Platform - Troubleshooting Guide

## **🚨 Common Issues and Solutions**

### **1. 502 Bad Gateway Errors**

**Symptoms:**
- Pages show "502 Bad Gateway"
- API endpoints return 502 errors
- Backend not responding

**Cause:** Backend service is down or crashed

**Solution:**
```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Check backend status
sudo systemctl status xploitrum-backend.service

# View recent logs
sudo journalctl -u xploitrum-backend.service -n 50

# Restart backend
sudo systemctl restart xploitrum-backend.service

# Or use the restart script
cd /home/xploitrum.org
bash scripts/restart-services.sh
```

---

### **2. CORS Errors (Access-Control-Allow-Origin)**

**Symptoms:**
```
Access to fetch at 'https://api.xploitrum.org/...' from origin 'https://xploitrum.org' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Cause:** The backend's `CORS_ORIGINS` (in production `.env`) does not include the origin the user is on. If users visit **https://xploitrum.org** (no www), that exact origin must be in `CORS_ORIGINS`.

**Solution:**
1. **On the server**, edit the backend `.env`:
   ```bash
   cd /home/xploitrum.org/backend
   nano .env
   ```
2. **Set CORS to include both www and non-www:**
   ```
   CORS_ORIGINS=https://www.xploitrum.org,https://xploitrum.org,https://ctf.xploitrum.org,https://api.xploitrum.org
   ```
3. **Restart the backend** so the new env is loaded:
   ```bash
   sudo systemctl restart xploitrum-backend
   ```

If the error persists:

4. **Handle CORS in Nginx** (recommended when preflight still fails):  
   The repo includes `nginx-api-cors.conf.example` with a `map` and a `location /` block that:
   - Handle **OPTIONS (preflight)** in Nginx and return 204 with CORS headers.
   - Add CORS headers to all API responses.  
   On the server, add the `map` at the top of your API server config, then replace the API `location /` with the example block. Run `sudo nginx -t && sudo systemctl reload nginx`.

5. **Check backend logs** for 4xx/5xx errors:
   ```bash
   sudo journalctl -u xploitrum-backend.service -n 100 -f
   ```

---

### **2b. 502 Bad Gateway on API (e.g. member-requests/submit)**

**Symptoms:**  
`POST https://api.xploitrum.org/api/v1/...` returns **502 (Bad Gateway)** and the browser shows a CORS error (because Nginx’s 502 response had no CORS headers).

**Cause:** Nginx cannot get a valid response from the backend (backend down, crashing, or not listening on the expected port).

**Solution (on the server):**

1. **Check if the backend is running**
   ```bash
   sudo systemctl status xploitrum-backend
   ```
   If it says `inactive` or `failed`, start it:
   ```bash
   sudo systemctl start xploitrum-backend
   ```

2. **Check backend logs** for crashes or errors
   ```bash
   sudo journalctl -u xploitrum-backend -n 100 --no-pager
   ```

3. **Test the API from the server**
   ```bash
   curl -s http://localhost:8000/health
   curl -X POST http://localhost:8000/api/v1/member-requests/submit \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@test.com","full_name":"Test","password":"test123","reason":"test"}'
   ```
   If `curl` to `localhost:8000` fails or returns an error, the problem is the backend (not Nginx or CORS).

4. **Restart the backend** after code or .env changes
   ```bash
   sudo systemctl restart xploitrum-backend
   ```

5. **Apply the updated Nginx config** so 502 responses include CORS headers (see `nginx-xploitrum-org-with-cors.conf`). Then reload Nginx:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

### **3. Instance Access Fails (Machine Page)**

**Symptoms:**
- "Instance not found" error
- 500 Internal Server Error when accessing `/machine/[id]`
- CORS errors when fetching instance

**Cause:** Backend endpoint error or service not restarted

**Solution:**
```bash
# 1. Check if GitHub Actions deployment completed
# Go to: https://github.com/YOUR_REPO/actions

# 2. SSH into droplet
ssh root@YOUR_DROPLET_IP

# 3. Pull latest changes manually (if needed)
cd /home/xploitrum.org
git pull origin main

# 4. Restart services
bash scripts/restart-services.sh

# 5. Check logs for errors
sudo journalctl -u xploitrum-backend.service -n 50
```

---

### **4. Challenge Deployment Fails**

**Symptoms:**
- "Start Machine" button doesn't work
- Instance stuck in "Starting" state
- Docker errors in logs

**Cause:** Docker service issues or missing images

**Solution:**
```bash
# 1. Check Docker status
sudo systemctl status docker

# 2. Check if Docker socket is accessible
ls -la /var/run/docker.sock

# 3. Pull required images
docker pull vulnerables/web-dvwa

# 4. Test Docker deployment
docker run -d --name test-dvwa -p 8080:80 vulnerables/web-dvwa

# 5. Access test container
curl http://localhost:8080

# 6. Clean up test
docker stop test-dvwa && docker rm test-dvwa

# 7. Check backend logs
sudo journalctl -u xploitrum-backend.service | grep -i docker
```

---

### **5. Frontend Build Failures**

**Symptoms:**
- Website doesn't update after deployment
- Old code still showing
- Build errors in logs

**Cause:** Frontend build failed or cache issues

**Solution:**
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Navigate to frontend
cd /home/xploitrum.org/frontend

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Restart frontend service
sudo systemctl restart xploitrum-frontend.service
```

---

### **6. Database Connection Errors**

**Symptoms:**
- "Database connection failed"
- SQLAlchemy errors in logs
- Data not saving

**Cause:** Database not running or connection issues

**Solution:**
```bash
# Check if database file exists
ls -la /home/xploitrum.org/backend/xploitrum.db

# Check backend database configuration
cd /home/xploitrum.org/backend
cat .env | grep DATABASE

# Test database connection
python3 -c "from app.core.database import engine; print(engine)"

# Reset database if needed (WARNING: deletes all data)
rm xploitrum.db
python3 -c "from app.core.database import init_db; init_db()"
```

---

## **🔍 Debugging Commands**

### **View Live Logs**
```bash
# Backend logs (follow mode)
sudo journalctl -u xploitrum-backend.service -f

# Frontend logs (follow mode)
sudo journalctl -u xploitrum-frontend.service -f

# All logs together
sudo journalctl -u xploitrum-backend.service -u xploitrum-frontend.service -f
```

### **Check Service Status**
```bash
# All services
sudo systemctl status xploitrum-*.service

# Backend only
sudo systemctl status xploitrum-backend.service

# Frontend only
sudo systemctl status xploitrum-frontend.service
```

### **Restart Services**
```bash
# Quick restart (use the script)
cd /home/xploitrum.org
bash scripts/restart-services.sh

# Manual restart
sudo systemctl restart xploitrum-backend.service
sudo systemctl restart xploitrum-frontend.service

# Force restart if stuck
sudo systemctl stop xploitrum-backend.service
sleep 2
sudo systemctl start xploitrum-backend.service
```

### **Check Container Status**
```bash
# View all running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs CONTAINER_ID

# Stop all challenge containers
docker ps -a --filter "label=managed_by=xploitrum" -q | xargs docker stop

# Remove all stopped challenge containers
docker ps -a --filter "label=managed_by=xploitrum" -q | xargs docker rm
```

---

## **🚀 Quick Fixes**

### **After Every Code Deploy**
```bash
cd /home/xploitrum.org
bash scripts/restart-services.sh
```

### **If Services Won't Start**
```bash
# Check for port conflicts
sudo netstat -tulpn | grep -E ':(3000|8000)'

# Kill processes on those ports if needed
sudo kill -9 $(sudo lsof -t -i:8000)
sudo kill -9 $(sudo lsof -t -i:3000)

# Restart services
bash scripts/restart-services.sh
```

### **If Database is Corrupted**
```bash
cd /home/xploitrum.org/backend

# Backup current database
cp xploitrum.db xploitrum.db.backup

# Reinitialize (WARNING: loses all data)
rm xploitrum.db
python3 -c "from app.core.database import init_db; init_db()"

# Recreate admin user
python3 create_admin.py
```

---

## **📊 Health Check Endpoints**

Test these URLs to verify services:

- **Frontend**: https://www.xploitrum.org
- **Backend API**: https://api.xploitrum.org/docs
- **Backend Health**: https://api.xploitrum.org/health
- **CTF Platform**: https://ctf.xploitrum.org
- **Admin Panel**: https://www.xploitrum.org/admin

---

## **🆘 When All Else Fails**

### **Full System Restart**
```bash
# Stop everything
sudo systemctl stop xploitrum-backend.service
sudo systemctl stop xploitrum-frontend.service

# Pull latest code
cd /home/xploitrum.org
git pull origin main

# Install dependencies
cd backend
pip3 install -r requirements.txt
cd ../frontend
npm install
npm run build

# Start everything
cd /home/xploitrum.org
bash scripts/restart-services.sh

# Check logs
sudo journalctl -u xploitrum-backend.service -f
```

### **Contact for Help**
If issues persist:
1. Check GitHub Actions logs
2. Copy backend error logs
3. Note the exact error message
4. Document steps to reproduce

---

## **✅ Prevention Tips**

1. **Always test locally** before deploying
2. **Check GitHub Actions** after every push
3. **Monitor logs** after deployment
4. **Restart services** after code changes
5. **Keep Docker images updated**
6. **Regular database backups**

---

**Remember:** Most issues are resolved by simply restarting the backend service! 🔄

