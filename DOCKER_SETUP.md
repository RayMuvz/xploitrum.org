# 🐳 Docker Container Setup for CTF Platform

## **🎯 Overview**

This guide explains how to properly set up Docker containers so they're accessible from the web browser in your CTF platform.

---

## **🔧 Required Setup on Your Droplet**

### **1. Open Required Ports in Firewall**

Your Docker containers will use ports 10000-65535. You need to open these in your firewall:

```bash
# Allow port range for Docker containers
sudo ufw allow 10000:65535/tcp comment 'CTF Challenge Containers'

# Reload firewall
sudo ufw reload

# Check status
sudo ufw status
```

### **2. Configure Docker Network**

```bash
# Create the challenge network (if not exists)
docker network create xploitrum_challenges --subnet=172.20.0.0/16

# Verify network exists
docker network ls | grep xploitrum
```

### **3. Test DVWA Deployment**

```bash
# Pull DVWA image
docker pull vulnerables/web-dvwa

# Run DVWA on port 10080 for testing
docker run -d --name dvwa-test \
  --network xploitrum_challenges \
  -p 10080:80 \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=dvwa \
  -e MYSQL_USER=dvwa \
  -e MYSQL_PASSWORD=password \
  vulnerables/web-dvwa

# Wait 30 seconds for DVWA to start
sleep 30

# Test access locally
curl http://localhost:10080

# Test from outside (replace with your droplet IP)
curl http://YOUR_DROPLET_IP:10080
```

If you can access DVWA, the setup works! Clean up:

```bash
docker stop dvwa-test && docker rm dvwa-test
```

---

## **🌐 Nginx Configuration for Container Access**

You have two options for accessing containers:

### **Option A: Direct Port Access (Recommended for Development)**

Users access containers directly via `http://xploitrum.org:PORT`

**No additional nginx configuration needed!** Just ensure ports are open.

### **Option B: Nginx Proxy (Recommended for Production)**

Proxy container ports through nginx for cleaner URLs.

Create `/etc/nginx/sites-available/ctf-containers`:

```nginx
# Proxy for CTF challenge containers
# This proxies /container/<port> to localhost:<port>

server {
    listen 80;
    server_name ctf.xploitrum.org;

    # Proxy to challenge containers
    location ~ ^/container/(\d+)/ {
        set $container_port $1;
        proxy_pass http://localhost:$container_port/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/ctf-containers /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Then update the Docker service to use: `http://ctf.xploitrum.org/container/{port}/`

---

## **🔍 Troubleshooting Container Access**

### **Check if Container is Running**

```bash
# List all challenge containers
docker ps --filter "label=managed_by=xploitrum"

# Get container details
docker inspect CONTAINER_ID
```

### **Check Container Ports**

```bash
# See which ports are mapped
docker port CONTAINER_ID

# Example output:
# 80/tcp -> 0.0.0.0:10080
```

### **Test Container Access**

```bash
# Test from droplet
curl http://localhost:PORT

# Test with public IP
curl http://YOUR_DROPLET_IP:PORT

# Test with domain
curl http://xploitrum.org:PORT
```

### **Check Container Logs**

```bash
# View container logs
docker logs CONTAINER_ID

# Follow logs in real-time
docker logs -f CONTAINER_ID
```

### **Common Issues**

#### **1. Can't access container from browser**

```bash
# Check firewall
sudo ufw status | grep PORT

# Check if port is listening
sudo netstat -tulpn | grep PORT

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Solution**: Ensure firewall allows the port and container is actually running

#### **2. Container exits immediately**

```bash
# Check why it exited
docker logs CONTAINER_ID

# Common issue: Missing environment variables
```

**Solution**: Check challenge configuration has correct `docker_environment` settings

#### **3. "Connection refused" error**

- Container might still be starting (wait 30-60 seconds)
- Container might have crashed (check logs)
- Wrong port mapping

---

## **🎯 Testing DVWA Access**

### **1. Create DVWA Challenge** (via Admin Panel)

Use Quick Setup template or manual:

```json
{
  "title": "DVWA - Test",
  "docker_image": "vulnerables/web-dvwa",
  "docker_ports": [{"internal": "80", "protocol": "tcp"}],
  "docker_environment": {
    "MYSQL_ROOT_PASSWORD": "password",
    "MYSQL_DATABASE": "dvwa",
    "MYSQL_USER": "dvwa",
    "MYSQL_PASSWORD": "password"
  },
  "max_instances": 10,
  "instance_timeout": 7200
}
```

### **2. Deploy Instance** (via CTF Platform)

- Click "Start Machine"
- Wait for deployment
- Check backend logs for port assignment

### **3. Find Assigned Port**

```bash
# View backend logs
sudo journalctl -u xploitrum-backend.service -n 100 | grep "Deployed challenge"

# Look for output like:
# Deployed challenge container: abc123
# Container IP: 172.20.0.5
# Access URLs: {'direct': 'http://xploitrum.org:10234', ...}
```

### **4. Test Direct Access**

```bash
# Replace PORT with the assigned port
curl http://YOUR_DROPLET_IP:PORT

# Should see DVWA HTML
```

### **5. Access from Browser**

Open: `http://xploitrum.org:PORT`

Or via the machine page iframe: `/machine/INSTANCE_ID`

---

## **📊 Production Configuration**

For production, I recommend:

1. **Use nginx proxy** for cleaner URLs
2. **SSL/HTTPS** for container access
3. **Rate limiting** to prevent abuse
4. **Auto cleanup** of stopped containers

### **Nginx with SSL**

```nginx
server {
    listen 443 ssl;
    server_name ctf.xploitrum.org;

    ssl_certificate /etc/letsencrypt/live/ctf.xploitrum.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ctf.xploitrum.org/privkey.pem;

    location ~ ^/container/(\d+)/ {
        set $container_port $1;
        proxy_pass http://localhost:$container_port/;
        # ... rest of proxy config
    }
}
```

### **Cleanup Script**

```bash
#!/bin/bash
# Clean up stopped containers every hour

docker ps -a --filter "label=managed_by=xploitrum" --filter "status=exited" -q | xargs -r docker rm

# Add to crontab:
# 0 * * * * /path/to/cleanup-containers.sh
```

---

## **✅ Verification Checklist**

Before deploying challenges:

- [ ] Firewall allows ports 10000-65535
- [ ] Docker network `xploitrum_challenges` exists
- [ ] Can deploy DVWA test container
- [ ] Can access test container from browser
- [ ] Backend logs show correct port assignments
- [ ] Instance URL loads in iframe
- [ ] Container stops properly

---

## **🚀 Quick Reference**

```bash
# View all challenge containers
docker ps --filter "label=managed_by=xploitrum"

# Stop all challenge containers
docker ps --filter "label=managed_by=xploitrum" -q | xargs docker stop

# Remove all challenge containers
docker ps -a --filter "label=managed_by=xploitrum" -q | xargs docker rm

# View container ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Test container access
curl http://localhost:PORT

# Check logs
sudo journalctl -u xploitrum-backend.service -f | grep container
```

---

**With this setup, your Docker containers will be fully accessible from the web browser!** 🎉

