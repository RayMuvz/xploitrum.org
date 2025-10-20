# 🎯 HTB-Style Machines Platform - Complete Setup Guide

## **✨ WHAT YOU NOW HAVE**

A **clean, HTB-style vulnerable machines platform** with:
- ✅ Browse machines (just like HackTheBox)
- ✅ Start/stop machines
- ✅ Pwnbox interface (terminal + browser in new tab)
- ✅ OpenVPN download option
- ✅ Admin machine management
- ✅ Single active machine enforcement
- ✅ DVWA quick setup

---

## **🚀 COMPLETE SETUP (Run on Your Droplet)**

### **Step 1: SSH into Your Server**

```bash
ssh root@YOUR_DROPLET_IP
cd /home/xploitrum.org
```

### **Step 2: Create Docker Network**

```bash
# Create the challenge network
docker network create xploitrum_challenges --subnet=172.20.0.0/16

# Verify
docker network ls | grep xploitrum
```

### **Step 3: Open Firewall Ports**

```bash
# Allow container ports
sudo ufw allow 10000:65535/tcp comment 'Machine Containers'
sudo ufw reload

# Verify
sudo ufw status | grep 10000
```

### **Step 4: Pull DVWA Image**

```bash
# Pull DVWA Docker image
docker pull vulnerables/web-dvwa:latest

# Verify
docker images | grep dvwa
```

### **Step 5: Initialize Database with Machine Table**

```bash
cd /home/xploitrum.org/backend

# Create machines table
python3 << 'EOF'
from app.core.database import engine, Base
from app.models.machine import Machine, MachineInstance

# Create tables
Base.metadata.create_all(bind=engine)
print("✅ Machine tables created!")
EOF
```

### **Step 6: Restart Services**

```bash
cd /home/xploitrum.org
bash scripts/restart-services.sh

# Wait for services to start
sleep 10

# Check status
sudo systemctl status xploitrum-backend.service
sudo systemctl status xploitrum-frontend.service
```

---

## **🎮 USER WORKFLOW (HTB-Style)**

### **1. Browse Machines**
- Go to: **https://www.xploitrum.org/machines**
- See list of available machines (DVWA, etc.)
- Filter by difficulty, OS

### **2. Start a Machine**
- Click **"Start Machine"** on any machine
- Wait 30-60 seconds for deployment
- Machine appears in "Active Machine" banner

### **3. Access Machine - Two Options:**

#### **Option A: Pwnbox (Recommended)**
- Click **"Open Pwnbox"** button
- Opens in new tab with:
  - **Terminal** (top half) - Command line interface
  - **Browser** (bottom half) - Web access to target
- Target IP shown: `10.10.10.X`

#### **Option B: OpenVPN + Local Terminal**
- Click **"VPN"** button to download config
- Connect via terminal:
  ```bash
  sudo openvpn xploitrum.ovpn
  ```
- Use your own tools (nmap, burp, etc.)

### **4. Hack the Machine**
- Enumerate services
- Find vulnerabilities
- Exploit and get flag
- Submit flag for points

### **5. Stop Machine**
- Click **"Stop"** button when done
- Frees up slot for next machine

---

## **👨‍💼 ADMIN WORKFLOW**

### **1. Create DVWA Machine (Quick Setup)**

- Go to: **https://www.xploitrum.org/admin/machines**
- Click: **"Quick: DVWA"** button
- Click: **"Create Machine"**
- Done! DVWA is now available

### **2. Create Custom Machine**

- Click: **"Create Machine"**
- Fill in:
  - **Name**: Machine name (e.g., "Lame", "Legacy")
  - **Description**: What users will exploit
  - **OS**: Linux/Windows/Other
  - **Difficulty**: easy/medium/hard/insane
  - **Points**: 10, 20, 30, 40, 50
  - **Docker Image**: e.g., `vulnhub/kioptrix`
  - **Flag**: `flag{machine_owned}`
- Click: **"Create Machine"**

### **3. Manage Machines**

- **Activate/Deactivate**: Toggle play/pause button
- **Delete**: Click trash icon
- **Monitor**: See active instances

---

## **🐳 DOCKER MACHINE EXAMPLES**

### **DVWA (Already Configured)**
```
Name: DVWA
Image: vulnerables/web-dvwa
Difficulty: Easy
Points: 20
```

### **Other Machines You Can Add:**

```bash
# Metasploitable 2
docker pull tleemcjr/metasploitable2

# WebGoat
docker pull webgoat/goatandwolf

# Juice Shop
docker pull bkimminich/juice-shop

# OWASP Mutillidae II
docker pull citizenstig/nowasp
```

---

## **📊 PWNBOX INTERFACE**

When user clicks "Open Pwnbox", new tab opens with:

```
┌─────────────────────────────────────────┐
│  Pwnbox - ParrotOS Security             │
│  Target: 10.10.10.42                    │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  TERMINAL                               │
│  ┌──(root㉿pwnbox)-[~]                  │
│  └─$ nmap -sV 10.10.10.42              │
│  └─$ _                                  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  BROWSER                                │
│  http://10.10.10.42                     │
│  [Shows target machine web interface]   │
└─────────────────────────────────────────┘
```

---

## **🔒 OPENVPN ACCESS**

When user clicks "VPN" button:
1. Downloads `xploitrum.ovpn` file
2. Shows instructions for connecting
3. User connects with their terminal:
   ```bash
   sudo openvpn xploitrum.ovpn
   ```
4. Can access machines directly via IP
5. Use any tools (Burp Suite, Metasploit, etc.)

---

## **✅ VERIFICATION CHECKLIST**

After setup, verify:

- [ ] Docker network `xploitrum_challenges` exists
- [ ] Firewall allows ports 10000-65535
- [ ] DVWA image pulled
- [ ] Backend service running
- [ ] Frontend service running
- [ ] Can access `/machines` page
- [ ] Can access `/admin/machines` page
- [ ] Can create DVWA machine
- [ ] Can start machine
- [ ] Pwnbox opens in new tab
- [ ] Can see machine in browser
- [ ] Can stop machine

---

## **🎯 TESTING PROCEDURE**

### **Test 1: Create DVWA**
```
1. Go to /admin/machines
2. Click "Quick: DVWA"
3. Click "Create Machine"
4. ✅ Machine appears in list
```

### **Test 2: Start Machine**
```
1. Go to /machines
2. Find DVWA
3. Click "Start Machine"
4. Wait 60 seconds
5. ✅ Active Machine banner appears
```

### **Test 3: Use Pwnbox**
```
1. Click "Open Pwnbox"
2. New tab opens
3. ✅ See terminal and browser
4. ✅ Browser shows DVWA (http://10.10.10.X)
```

### **Test 4: Stop Machine**
```
1. Click "Stop" button
2. ✅ Machine stops
3. ✅ Can start new machine
```

---

## **🐛 TROUBLESHOOTING**

### **"Network not found" Error**
```bash
# Create the network
docker network create xploitrum_challenges --subnet=172.20.0.0/16
```

### **Can't Access Machine in Browser**
```bash
# Check firewall
sudo ufw status | grep 10000

# Open ports if needed
sudo ufw allow 10000:65535/tcp
sudo ufw reload
```

### **Backend Errors**
```bash
# Check logs
sudo journalctl -u xploitrum-backend.service -n 100

# Restart backend
sudo systemctl restart xploitrum-backend.service
```

### **DVWA Won't Start**
```bash
# DVWA needs time to initialize
# Wait 60 seconds after starting

# Check container logs
docker logs <container_id>
```

---

## **🎉 SUCCESS CRITERIA**

Your Machines platform is working when:

1. ✅ Can browse machines at `/machines`
2. ✅ Can start a machine
3. ✅ Active machine banner appears
4. ✅ Pwnbox opens with terminal + browser
5. ✅ Can see target machine in browser
6. ✅ Can download VPN config
7. ✅ Can stop machine
8. ✅ Can start different machine
9. ✅ Admin can create/manage machines
10. ✅ No 500 or CORS errors

---

## **📈 NEXT STEPS**

### **Add More Machines:**
```
- Metasploitable 2
- Juice Shop
- WebGoat
- Custom vulnerable apps
```

### **Future Enhancements:**
- Flag submission system
- Leaderboard for machine owns
- User profiles with owned machines
- Machine ratings and reviews
- WriteUps section

---

## **🎯 KEY DIFFERENCES FROM OLD CTF PLATFORM**

### **Old (Complex, Had Issues):**
- ❌ Complex challenge system
- ❌ Multiple instance types
- ❌ Complicated deployment
- ❌ Many errors

### **New (Clean, HTB-Like):**
- ✅ Simple machines system
- ✅ Single active machine
- ✅ Clean deployment
- ✅ HTB user experience
- ✅ Pwnbox interface
- ✅ OpenVPN option
- ✅ Production-ready

---

## **💡 HOW IT WORKS**

```
User Flow:
┌──────────────┐
│ Browse       │ → See DVWA, Lame, etc.
│ /machines    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Start        │ → Deploy Docker container
│ Machine      │    Assign IP (10.10.10.X)
└──────┬───────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ Open        │  │ Download VPN │  │ Direct      │
│ Pwnbox      │  │ Connect      │  │ Browser     │
│ (New Tab)   │  │ Use Tools    │  │ Access      │
└─────────────┘  └──────────────┘  └─────────────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Hack Machine │
                  │ Find Flag    │
                  │ Submit       │
                  │ Get Points   │
                  └──────────────┘
```

---

**Your HTB-style Machines platform is ready to deploy!** 🚀

Run the setup commands above and you'll have a working platform in ~10 minutes!

