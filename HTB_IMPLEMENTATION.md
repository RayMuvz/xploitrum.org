# 🎯 HackTheBox-Style CTF Platform Implementation

## **Complete Roadmap to HTB-like Functionality**

This document outlines the complete implementation to make XploitRUM work exactly like HackTheBox.

---

## **📊 HackTheBox Features Analysis**

### **1. Access Methods**
- **OpenVPN**: Secure VPN connection to lab network
- **Pwnbox (Browser)**: ParrotOS-based virtual machine in browser
- **Direct Web Access**: For web-based challenges
- **SSH Access**: For shell-based challenges

### **2. Pwnbox Components**
- **noVNC**: VNC in browser for graphical desktop
- **xterm.js**: Web-based terminal
- **ParrotOS**: Full Debian-based pentesting OS
- **Pre-installed tools**: nmap, burpsuite, metasploit, etc.

### **3. Instance Management**
- One active machine per user
- Auto-stop after timeout
- Resource limits
- Network isolation

---

## **🏗️ Architecture Design**

```
┌─────────────────────────────────────────────────────┐
│                   User's Browser                     │
├─────────────────┬───────────────────┬───────────────┤
│   OpenVPN Tab   │   Pwnbox Tab      │  Target Tab   │
│   (Download)    │   (noVNC + Term)  │  (Challenge)  │
└────────┬────────┴────────┬──────────┴───────┬───────┘
         │                 │                   │
    ┌────▼─────┐      ┌───▼────┐         ┌───▼────┐
    │ OpenVPN  │      │ Pwnbox │         │ Target │
    │  Server  │◄─────┤Container│◄────────┤Container│
    │ (1194)   │      │(ParrotOS)│        │ (DVWA) │
    └──────────┘      └─────────┘         └────────┘
         │                 │                   │
         └─────────────────┴───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Backend   │
                    │   (FastAPI) │
                    └─────────────┘
```

---

## **🔧 Component Implementation**

### **Phase 1: OpenVPN Server** ⚡ CRITICAL

#### **Setup Steps:**

```bash
# 1. Install OpenVPN and Easy-RSA
sudo apt update
sudo apt install openvpn easy-rsa -y

# 2. Initialize PKI
make-cadir ~/openvpn-ca
cd ~/openvpn-ca

# 3. Configure vars
nano vars
# Set:
# export KEY_COUNTRY="US"
# export KEY_PROVINCE="CA"
# export KEY_CITY="San Francisco"
# export KEY_ORG="XploitRUM"
# export KEY_EMAIL="admin@xploitrum.org"
# export KEY_OU="XploitRUM"

# 4. Build CA
source vars
./clean-all
./build-ca

# 5. Build server certificate
./build-key-server server

# 6. Generate Diffie-Hellman parameters
./build-dh

# 7. Generate TLS auth key
openvpn --genkey --secret keys/ta.key

# 8. Copy keys to OpenVPN directory
sudo cp keys/{server.crt,server.key,ca.crt,dh2048.pem,ta.key} /etc/openvpn/

# 9. Create server configuration
sudo nano /etc/openvpn/server.conf
```

#### **OpenVPN Server Config:**

```conf
# /etc/openvpn/server.conf
port 1194
proto udp
dev tun
ca ca.crt
cert server.crt
key server.key
dh dh2048.pem
tls-auth ta.key 0

# Network configuration
server 10.8.0.0 255.255.255.0
push "route 172.20.0.0 255.255.0.0"  # Route to challenge network

# Permissions
user nobody
group nogroup
persist-key
persist-tun

# Logging
status /var/log/openvpn-status.log
log-append /var/log/openvpn.log
verb 3

# Security
cipher AES-256-GCM
auth SHA256
```

#### **Client Certificate Generation:**

```bash
# Generate client cert (run for each user if needed)
cd ~/openvpn-ca
source vars
./build-key client1

# Create client config
cat > ~/client1.ovpn <<EOF
client
dev tun
proto udp
remote xploitrum.org 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
verb 3

<ca>
$(cat /etc/openvpn/ca.crt)
</ca>

<cert>
$(cat ~/openvpn-ca/keys/client1.crt)
</cert>

<key>
$(cat ~/openvpn-ca/keys/client1.key)
</key>

<tls-auth>
$(cat /etc/openvpn/ta.key)
</tls-auth>
key-direction 1
EOF
```

---

### **Phase 2: Pwnbox Container (ParrotOS + noVNC)**

#### **Dockerfile for Pwnbox:**

```dockerfile
# Dockerfile.pwnbox
FROM parrotsec/security:latest

# Install VNC server and noVNC
RUN apt-get update && apt-get install -y \
    tigervnc-standalone-server \
    tigervnc-common \
    novnc \
    websockify \
    supervisor \
    xfce4 \
    xfce4-terminal \
    firefox-esr \
    burpsuite \
    nmap \
    metasploit-framework \
    sqlmap \
    gobuster \
    ffuf \
    john \
    hashcat \
    && apt-get clean

# Set up VNC
RUN mkdir -p ~/.vnc
RUN echo "password" | vncpasswd -f > ~/.vnc/passwd
RUN chmod 600 ~/.vnc/passwd

# Create VNC startup script
RUN echo "#!/bin/bash\nxrdb $HOME/.Xresources\nstartxfce4 &" > ~/.vnc/xstartup
RUN chmod +x ~/.vnc/xstartup

# Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5900 6080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
```

#### **Supervisor Config:**

```ini
# supervisord.conf
[supervisord]
nodaemon=true

[program:vncserver]
command=/usr/bin/vncserver :0 -geometry 1280x720 -depth 24
autorestart=true

[program:novnc]
command=/usr/share/novnc/utils/launch.sh --vnc localhost:5900 --listen 6080
autorestart=true
```

---

### **Phase 3: Web Terminal (xterm.js + WebSocket)**

#### **Backend WebSocket Endpoint:**

```python
# backend/app/api/v1/endpoints/terminal.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import subprocess

router = APIRouter()

@router.websocket("/ws/{instance_id}")
async def terminal_websocket(websocket: WebSocket, instance_id: int):
    await websocket.accept()
    
    # Get container name from instance
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        await websocket.close()
        return
    
    # Start docker exec process
    process = await asyncio.create_subprocess_exec(
        "docker", "exec", "-it", instance.container_id, "/bin/bash",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    async def read_output():
        while True:
            output = await process.stdout.read(1024)
            if output:
                await websocket.send_text(output.decode())
            else:
                break
    
    async def write_input():
        try:
            while True:
                data = await websocket.receive_text()
                process.stdin.write(data.encode())
                await process.stdin.drain()
        except WebSocketDisconnect:
            process.kill()
    
    await asyncio.gather(read_output(), write_input())
```

#### **Frontend xterm.js Integration:**

```typescript
// frontend/src/components/Terminal.tsx
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

export function WebTerminal({ instanceId }: { instanceId: number }) {
    const terminalRef = useRef<HTMLDivElement>(null)
    const terminal = useRef<Terminal>()
    const ws = useRef<WebSocket>()
    
    useEffect(() => {
        if (!terminalRef.current) return
        
        terminal.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: {
                background: '#000000',
                foreground: '#00ff00'
            }
        })
        
        const fitAddon = new FitAddon()
        terminal.current.loadAddon(fitAddon)
        terminal.current.open(terminalRef.current)
        fitAddon.fit()
        
        // Connect WebSocket
        const wsUrl = `wss://api.xploitrum.org/api/v1/terminal/ws/${instanceId}`
        ws.current = new WebSocket(wsUrl)
        
        ws.current.onmessage = (event) => {
            terminal.current?.write(event.data)
        }
        
        terminal.current.onData((data) => {
            ws.current?.send(data)
        })
        
        return () => {
            ws.current?.close()
            terminal.current?.dispose()
        }
    }, [instanceId])
    
    return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
}
```

---

### **Phase 4: noVNC Integration**

#### **Frontend noVNC Component:**

```typescript
// frontend/src/components/VNCViewer.tsx
import RFB from '@novnc/novnc'

export function VNCViewer({ instanceId, port }: { instanceId: number, port: number }) {
    const canvasRef = useRef<HTMLDivElement>(null)
    const rfb = useRef<RFB>()
    
    useEffect(() => {
        if (!canvasRef.current) return
        
        const vncUrl = `wss://api.xploitrum.org/novnc/${instanceId}`
        
        rfb.current = new RFB(canvasRef.current, vncUrl, {
            credentials: { password: 'password' }
        })
        
        rfb.current.scaleViewport = true
        rfb.current.resizeSession = true
        
        return () => {
            rfb.current?.disconnect()
        }
    }, [instanceId])
    
    return (
        <div 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        />
    )
}
```

---

### **Phase 5: Complete Machine Page**

Create `/machine/[id]/page.tsx` with:
- **Split view**: VNC (desktop) + Terminal
- **Tabbed interface**: Desktop, Terminal, Browser
- **Fullscreen modes**
- **Connection status**
- **Reconnect on disconnect**

---

## **🚀 Implementation Priority**

### **Week 1: Infrastructure**
1. ✅ Set up OpenVPN server
2. ✅ Configure firewall rules
3. ✅ Test VPN connectivity
4. ✅ Generate client certificates

### **Week 2: Pwnbox**
1. ✅ Build ParrotOS container with VNC
2. ✅ Set up noVNC
3. ✅ Test desktop access
4. ✅ Install pentesting tools

### **Week 3: Terminal**
1. ✅ Implement WebSocket endpoint
2. ✅ Integrate xterm.js
3. ✅ Test terminal functionality
4. ✅ Handle reconnection

### **Week 4: Integration**
1. ✅ Update machine page with all components
2. ✅ Fix all CORS issues
3. ✅ Test complete workflow
4. ✅ Performance optimization

---

## **📦 Required Packages**

### **Frontend:**
```json
{
  "dependencies": {
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "xterm-addon-web-links": "^0.9.0",
    "@novnc/novnc": "^1.4.0"
  }
}
```

### **Backend:**
```txt
websockets==12.0
python-socketio==5.10.0
```

---

## **🔒 Security Considerations**

1. **VPN Authentication**: User-specific certificates
2. **Network Isolation**: Separate Docker network
3. **Resource Limits**: CPU/Memory quotas
4. **Timeouts**: Auto-stop after inactivity
5. **Rate Limiting**: Prevent abuse

---

## **✅ Success Criteria**

- [ ] OpenVPN connects successfully
- [ ] Can access challenge network via VPN
- [ ] Pwnbox loads with ParrotOS desktop
- [ ] Terminal is fully functional
- [ ] Can access target machines
- [ ] No CORS or 500 errors
- [ ] Auto-cleanup works
- [ ] Performance is acceptable

---

**This is the complete blueprint for HTB-like functionality!** 🎯

