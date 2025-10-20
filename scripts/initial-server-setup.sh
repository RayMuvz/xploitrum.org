#!/bin/bash

###############################################################################
# XploitRUM Initial Server Setup Script
# Run this ONCE on your fresh DigitalOcean droplet as root
###############################################################################

set -e

echo "🚀 XploitRUM Server Setup"
echo "================================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (or with sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
echo "🛠️  Installing essential tools..."
apt install -y curl wget git ufw fail2ban

# Create xploitrum user
echo "👤 Creating xploitrum user..."
if id "xploitrum" &>/dev/null; then
    echo "User xploitrum already exists"
else
    adduser --disabled-password --gecos "" xploitrum
    usermod -aG sudo xploitrum
    echo "xploitrum ALL=(ALL) NOPASSWD: /bin/systemctl restart xploitrum-*" >> /etc/sudoers.d/xploitrum
    echo "xploitrum ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" >> /etc/sudoers.d/xploitrum
    echo "xploitrum ALL=(ALL) NOPASSWD: /usr/sbin/nginx" >> /etc/sudoers.d/xploitrum
fi

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python
echo "🐍 Installing Python..."
apt install -y python3 python3-pip python3-venv

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker xploitrum
    rm get-docker.sh
fi

# Install PostgreSQL
echo "🗄️  Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install Certbot
echo "🔒 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Setup firewall
echo "🛡️  Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1194/udp  # OpenVPN

# Setup fail2ban
echo "🚫 Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

echo ""
echo "================================================"
echo "✅ Server setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Switch to xploitrum user: su - xploitrum"
echo "2. Generate SSH key: ssh-keygen -t ed25519"
echo "3. Add key to GitHub"
echo "4. Clone repository: git clone git@github.com:YOUR_USERNAME/xploitrum.org.git"
echo "5. Follow DEPLOYMENT.md for remaining setup"
echo ""

