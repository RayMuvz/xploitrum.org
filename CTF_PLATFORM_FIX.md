# 🔧 CTF Platform - Complete Fix Guide

## **🎯 Goal: Working CTF Platform TODAY**

Make the CTF platform (`/ctf-platform`) fully functional with:
- ✅ Challenge browsing
- ✅ Instance deployment (DVWA, etc.)
- ✅ Machine access with working browser
- ✅ Instance management
- ✅ Flag submission

---

## **📋 Current Status**

### **What Works:**
- ✅ Challenge listing
- ✅ Category/difficulty filtering
- ✅ Admin challenge management
- ✅ Basic Docker integration
- ✅ Single instance enforcement

### **What Needs Fixing:**
1. ❌ Instance 404 errors
2. ❌ Container browser access
3. ❌ Firewall ports not open
4. ❌ Backend needs restart
5. ❌ Missing proper error handling

---

## **🚀 COMPLETE FIX PROCEDURE**

### **Step 1: Server Setup (SSH Required)**

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Navigate to project
cd /home/xploitrum.org

# 1. Open firewall for Docker containers (CRITICAL)
sudo ufw allow 10000:65535/tcp comment 'CTF Challenge Containers'
sudo ufw reload
sudo ufw status  # Verify

# 2. Ensure Docker network exists
docker network create xploitrum_challenges --subnet=172.20.0.0/16 2>/dev/null || echo "Network exists"
docker network ls | grep xploitrum

# 3. Pull DVWA image
docker pull vulnerables/web-dvwa:latest

# 4. Test Docker deployment
docker run -d --name dvwa-test \
  --network xploitrum_challenges \
  -p 10080:80 \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=dvwa \
  -e MYSQL_USER=dvwa \
  -e MYSQL_PASSWORD=password \
  vulnerables/web-dvwa:latest

# Wait 30 seconds
sleep 30

# 5. Test access
curl http://localhost:10080
# Should see HTML

# 6. Clean up test
docker stop dvwa-test
docker rm dvwa-test

# 7. Restart backend service
bash scripts/restart-services.sh

# 8. Watch logs for errors
sudo journalctl -u xploitrum-backend.service -f
```

---

### **Step 2: Create DVWA Challenge (Web UI)**

1. **Go to**: https://www.xploitrum.org/admin/challenges
2. **Click**: "Quick Setup"
3. **Select**: "DVWA Template"
4. **Click**: "Create Challenge"
5. **Verify**: Challenge appears in list with status "active"

---

### **Step 3: Test Complete Workflow**

#### **A. Deploy Instance**

1. **Go to**: https://www.xploitrum.org/ctf-platform (or https://ctf.xploitrum.org)
2. **Find**: "DVWA" challenge
3. **Click**: "Start Machine"
4. **Wait**: 30-60 seconds
5. **Check**: "My Instances" tab shows running instance

#### **B. Access Machine**

1. **Click**: "Access Machine" button
2. **Page loads**: `/machine/[ID]`
3. **Browser section shows**: DVWA login page in iframe
4. **URL bar shows**: `http://xploitrum.org:10XXX`

#### **C. Use DVWA**

1. **Login**: admin / password
2. **Setup Database**: Click "Create / Reset Database"
3. **Explore**: Navigate through DVWA modules
4. **Test**: Try SQL injection, XSS, etc.

#### **D. Submit Flag**

1. **Find flag**: `flag{dvwa_sql_injection_master}`
2. **Go to**: CTF Platform
3. **Click**: "Submit Flag" on DVWA challenge
4. **Enter**: flag
5. **Submit**: Get points!

#### **E. Stop Instance**

1. **Go to**: "My Instances" tab
2. **Click**: "Stop" button
3. **Confirm**: Instance removed from list
4. **Verify**: Can start new instance now

---

## **🐛 Troubleshooting**

### **Issue: 404 Instance Not Found**

**Cause**: Instance wasn't created or was deleted

**Fix**:
```bash
# Check backend logs
sudo journalctl -u xploitrum-backend.service -n 200 | grep -i instance

# Look for errors during deployment
```

**Solution**: Deploy fresh instance, don't try to access old ones

---

### **Issue: Container Not Accessible**

**Symptoms**: Can't access `http://xploitrum.org:PORT`

**Check**:
```bash
# 1. Is container running?
docker ps | grep challenge

# 2. Is port mapped?
docker port CONTAINER_ID

# 3. Is firewall open?
sudo ufw status | grep 10000:65535

# 4. Can access locally?
curl http://localhost:PORT
```

**Fix**:
```bash
# Open firewall if needed
sudo ufw allow 10000:65535/tcp
sudo ufw reload
```

---

### **Issue: DVWA Won't Load**

**Symptoms**: Browser shows loading forever

**Fix**:
```bash
# DVWA needs time to start MySQL
# Wait 60 seconds after deployment

# Check container logs
docker logs CONTAINER_ID

# Look for "ready for connections"
```

---

### **Issue: Single Instance Error**

**Symptoms**: "You already have an active instance running"

**Good!** This is working as intended.

**Fix**: Stop your current instance first, then start new one

---

## **📊 Verification Checklist**

After setup, verify:

- [ ] Firewall allows 10000-65535/tcp
- [ ] Docker network `xploitrum_challenges` exists
- [ ] DVWA image pulled successfully
- [ ] Backend service running
- [ ] Can create DVWA challenge in admin
- [ ] Can deploy instance from CTF platform
- [ ] Can access machine page
- [ ] Browser iframe shows DVWA
- [ ] Can login to DVWA
- [ ] Can stop instance
- [ ] Can start new instance

---

## **🎯 Expected Behavior**

### **Working CTF Platform:**

```
User Flow:
1. Browse challenges → See DVWA ✓
2. Click "Start Machine" → Deploys container ✓
3. Wait 60 seconds → Instance ready ✓
4. Click "Access Machine" → Opens /machine/ID ✓
5. Browser section → Shows DVWA in iframe ✓
6. Login to DVWA → Works! ✓
7. Hack DVWA → Find vulnerabilities ✓
8. Submit flag → Get points ✓
9. Stop instance → Can start new one ✓
```

### **Admin Flow:**

```
Admin Tasks:
1. Login as admin → Access admin panel ✓
2. Go to "Manage CTF Machines" ✓
3. Click "Quick Setup" ✓
4. Use DVWA template ✓
5. Create challenge ✓
6. Challenge appears for users ✓
7. Monitor active instances ✓
8. View submissions ✓
```

---

## **🚨 Common Mistakes**

### **1. Forgetting to Open Firewall**
```bash
# MUST RUN THIS:
sudo ufw allow 10000:65535/tcp
```

### **2. Not Waiting for DVWA to Start**
```
DVWA needs 30-60 seconds to initialize MySQL
Don't panic if it doesn't load immediately!
```

### **3. Trying to Access Old Instances**
```
If instance ID is 19 and you get 404,
deploy a NEW instance (will be ID 20, 21, etc.)
```

### **4. Not Restarting Backend**
```bash
# After code changes, ALWAYS run:
bash /home/xploitrum.org/scripts/restart-services.sh
```

---

## **📞 Support Commands**

### **View All Running Containers**
```bash
docker ps --filter "label=managed_by=xploitrum"
```

### **View Backend Logs**
```bash
sudo journalctl -u xploitrum-backend.service -f
```

### **Check Instance in Database**
```bash
cd /home/xploitrum.org/backend
python3 << 'EOF'
from app.core.database import get_db
from app.models.instance import Instance

db = next(get_db())
instances = db.query(Instance).all()
for i in instances:
    print(f"ID: {i.id}, Status: {i.status}, Container: {i.container_name}")
EOF
```

### **Cleanup All Containers**
```bash
docker ps -a --filter "label=managed_by=xploitrum" -q | xargs docker stop
docker ps -a --filter "label=managed_by=xploitrum" -q | xargs docker rm
```

---

## **✅ Success Metrics**

Your CTF platform is working when:

1. ✅ No 404 errors on machine page
2. ✅ No 500 errors on API calls
3. ✅ No CORS errors in console
4. ✅ Containers deploy successfully
5. ✅ Browser iframe shows challenge
6. ✅ Can interact with DVWA
7. ✅ Single instance enforcement works
8. ✅ Stop instance works
9. ✅ Can deploy multiple times
10. ✅ Flag submission works

---

## **🎉 You're Done!**

Once all checks pass:
- ✅ **CTF platform is production-ready**
- ✅ **Users can practice web security**
- ✅ **DVWA and similar challenges work**
- ✅ **Professional CTF experience**

**No Pwnbox or VPN needed for web challenges!**

---

## **📈 Next Steps (Optional)**

After basic platform works:
1. Add more challenges (Juice Shop, WebGoat, etc.)
2. Create custom challenges
3. Set up leaderboard
4. Host CTF competitions
5. Add more challenge categories

But first: **Get the basic platform working!** 🚀

