# 🎯 Complete HackTheBox-Style Platform Setup Guide

## **⚠️ IMPORTANT: This is a Major Infrastructure Project**

Building an HTB-like platform requires:
- **Time**: 2-4 weeks of focused development
- **Infrastructure**: OpenVPN server, Docker, networking
- **Expertise**: Docker, networking, security, full-stack development
- **Resources**: Server with good CPU/RAM (minimum 8GB RAM, 4 CPU cores)

---

## **🚀 Quick Start (Get Something Working TODAY)**

### **Option A: Basic Working Platform (What You Have)**

Your current platform WORKS for web challenges:
- ✅ Docker containers deploy
- ✅ Web browser access via iframe
- ✅ Single instance enforcement
- ✅ Instance management

**To make it work RIGHT NOW:**

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# 1. Open firewall for containers
sudo ufw allow 10000:65535/tcp
sudo ufw reload

# 2. Restart backend
cd /home/xploitrum.org
bash scripts/restart-services.sh

# 3. Test DVWA
docker run -d --name test-dvwa \
  --network xploitrum_challenges \
  -p 10080:80 \
  vulnerables/web-dvwa

# 4. Access at: http://YOUR_DROPLET_IP:10080
```

### **Option B: Full HTB Platform (2-4 Weeks)**

Follow the complete guide below.

---

## **📋 COMPLETE SETUP CHECKLIST**

### **Phase 1: Server Preparation (Day 1)**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
  openvpn \
  easy-rsa \
  docker.io \
  docker-compose \
  nginx \
  certbot \
  python3-certbot-nginx

# Start services
sudo systemctl enable docker openvpn nginx
sudo systemctl start docker openvpn nginx
```

### **Phase 2: OpenVPN Server (Day 1-2)**

```bash
# 1. Set up Easy-RSA
make-cadir ~/openvpn-ca
cd ~/openvpn-ca

# 2. Edit vars file
nano vars
# Set your organization details

# 3. Build CA
source vars
./clean-all
./build-ca --batch

# 4. Build server certificate
./build-key-server server --batch

# 5. Generate DH parameters (takes 10-30 minutes)
./build-dh

# 6. Generate TLS auth key
openvpn --genkey --secret keys/ta.key

# 7. Copy to OpenVPN directory
sudo cp keys/{server.crt,server.key,ca.crt,dh2048.pem,ta.key} /etc/openvpn/server/

# 8. Create server config
sudo tee /etc/openvpn/server/server.conf > /dev/null <<'EOF'
port 1194
proto udp
dev tun
ca ca.crt
cert server.crt
key server.key
dh dh2048.pem
tls-auth ta.key 0

server 10.8.0.0 255.255.255.0
push "route 172.20.0.0 255.255.0.0"

user nobody
group nogroup
persist-key
persist-tun

status /var/log/openvpn-status.log
log-append /var/log/openvpn.log
verb 3

cipher AES-256-GCM
auth SHA256
EOF

# 9. Enable IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 10. Configure firewall
sudo ufw allow 1194/udp
sudo ufw allow OpenSSH

# 11. Set up NAT
sudo iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -s 10.8.0.0/24 -j ACCEPT
sudo iptables -A FORWARD -d 10.8.0.0/24 -j ACCEPT

# Make iptables persistent
sudo apt install iptables-persistent -y
sudo netfilter-persistent save

# 12. Start OpenVPN
sudo systemctl enable openvpn-server@server
sudo systemctl start openvpn-server@server

# 13. Check status
sudo systemctl status openvpn-server@server
```

### **Phase 3: Build Pwnbox Container (Day 2-3)**

Create `/opt/pwnbox/Dockerfile`:

```dockerfile
FROM parrotsec/security:latest

ENV DEBIAN_FRONTEND=noninteractive

# Install VNC and desktop
RUN apt-get update && apt-get install -y \
    tigervnc-standalone-server \
    tigervnc-common \
    tigervnc-tools \
    novnc \
    websockify \
    supervisor \
    xfce4 \
    xfce4-terminal \
    xfce4-goodies \
    firefox-esr \
    vim \
    nano \
    git \
    curl \
    wget \
    net-tools \
    iputils-ping \
    nmap \
    nikto \
    sqlmap \
    gobuster \
    ffuf \
    john \
    hydra \
    metasploit-framework \
    && apt-get clean

# Create user
RUN useradd -m -s /bin/bash ctfuser && \
    echo "ctfuser:password" | chpasswd && \
    mkdir -p /home/ctfuser/.vnc

# Configure VNC
RUN echo "password" | vncpasswd -f > /home/ctfuser/.vnc/passwd && \
    chmod 600 /home/ctfuser/.vnc/passwd && \
    chown -R ctfuser:ctfuser /home/ctfuser

# VNC startup script
RUN echo '#!/bin/bash\nxrdb $HOME/.Xresources\nstartxfce4 &' > /home/ctfuser/.vnc/xstartup && \
    chmod +x /home/ctfuser/.vnc/xstartup

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
EXPOSE 5900 6080 22

USER ctfuser
WORKDIR /home/ctfuser

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
```

Create `/opt/pwnbox/supervisord.conf`:

```ini
[supervisord]
nodaemon=true
user=root

[program:vncserver]
command=/usr/bin/Xvnc :0 -geometry 1280x720 -depth 24 -rfbport 5900 -SecurityTypes None -AlwaysShared
user=ctfuser
autorestart=true
stdout_logfile=/var/log/supervisor/vncserver.log
stderr_logfile=/var/log/supervisor/vncserver_err.log

[program:novnc]
command=/usr/share/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080
user=ctfuser
autorestart=true
stdout_logfile=/var/log/supervisor/novnc.log
stderr_logfile=/var/log/supervisor/novnc_err.log
```

Build the container:

```bash
cd /opt/pwnbox
docker build -t xploitrum/pwnbox:latest .

# Test it
docker run -d -p 6080:6080 -p 5900:5900 --name pwnbox-test xploitrum/pwnbox:latest

# Access at: http://YOUR_IP:6080/vnc.html
```

### **Phase 4: Install Frontend Dependencies (Day 3)**

```bash
cd /home/xploitrum.org/frontend

# Install xterm.js and noVNC
npm install xterm xterm-addon-fit xterm-addon-web-links @novnc/novnc

# Rebuild
npm run build
```

### **Phase 5: Update Backend (Day 3-4)**

I'll create the necessary backend files in the next steps...

### **Phase 6: Testing (Day 4-5)**

```bash
# Test OpenVPN
sudo openvpn --config ~/client.ovpn

# Test Pwnbox access
curl http://localhost:6080

# Test full workflow
# 1. Deploy instance
# 2. Connect via VPN
# 3. Access Pwnbox
# 4. Ping target machine
# 5. Exploit vulnerabilities
```

---

## **🎯 REALISTIC TIMELINE**

### **Minimum Viable Product (1 Week)**
- ✅ Current web browser access (DONE)
- ⏳ OpenVPN server (2 days)
- ⏳ Basic Pwnbox (2 days)  
- ⏳ Testing (1 day)

### **Full HTB Clone (4 Weeks)**
- Week 1: OpenVPN + Infrastructure
- Week 2: Pwnbox + noVNC
- Week 3: Web terminal + WebSocket
- Week 4: Polish + Testing + Optimization

---

## **💰 COST ESTIMATE**

### **DigitalOcean Droplet Requirements:**
- **Current**: Basic droplet ($12/month) - INSUFFICIENT
- **Minimum**: $24/month (4GB RAM, 2 CPU)
- **Recommended**: $48/month (8GB RAM, 4 CPU)
- **Production**: $96/month (16GB RAM, 8 CPU)

### **Why More Resources?**
- OpenVPN server
- Multiple Docker containers
- Pwnbox instances (heavy - 1-2GB RAM each)
- Challenge containers
- Database + Backend + Frontend

---

## **⚠️ CRITICAL DECISION POINT**

You need to decide:

### **Option A: Use What You Have (Works Today)**
- ✅ Web challenges work NOW
- ✅ Browser iframe access
- ✅ DVWA and similar challenges
- ❌ No Pwnbox
- ❌ No VPN (but not needed for web challenges)

### **Option B: Build Full HTB Platform (4 weeks + $$$)**
- ✅ Full Pwnbox with ParrotOS
- ✅ OpenVPN network access
- ✅ Terminal + Desktop GUI
- ⏰ 4 weeks development time
- 💰 Upgrade server ($48+/month)

---

## **🚀 MY RECOMMENDATION**

**Start with Option A**, make it production-ready, THEN add HTB features:

### **Phase 1: Production-Ready NOW (This Week)**
1. Fix current errors (DONE mostly)
2. Open firewall ports
3. Restart services
4. Test with DVWA
5. Add more web challenges

### **Phase 2: Add Terminal (Week 2)**
1. Implement xterm.js WebSocket
2. SSH into containers
3. Command execution

### **Phase 3: Add Pwnbox (Week 3-4)**
1. Build ParrotOS container
2. Implement noVNC
3. Test full workflow

### **Phase 4: Add OpenVPN (Week 5)**
1. Set up VPN server
2. Generate certificates
3. Network routing

---

## **📞 NEXT STEPS**

Tell me which option you want:

**A)** Get current platform fully working TODAY (recommended)
**B)** Start full HTB build (4 weeks, need server upgrade)
**C)** Do both: Fix current + start HTB in parallel

I'll then create the exact files and commands you need! 🎯

