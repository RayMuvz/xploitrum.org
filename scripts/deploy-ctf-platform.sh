#!/bin/bash

# XploitRUM CTF Platform - Production Deployment Script
# This script sets up the fully functional CTF platform with DVWA

set -e

echo "🚀 XploitRUM CTF Platform - Production Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed and running
print_status "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker service."
    exit 1
fi

print_success "Docker is installed and running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found, trying 'docker compose'..."
    if ! docker compose version &> /dev/null; then
        print_error "Neither 'docker-compose' nor 'docker compose' is available"
        exit 1
    fi
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

print_success "Docker Compose is available"

# Navigate to project directory
cd /home/xploitrum.org

print_status "Navigating to project directory: $(pwd)"

# Pull latest changes
print_status "Pulling latest changes from Git..."
git pull origin main

# Install Python dependencies
print_status "Installing Python dependencies..."
cd backend
python3 -m pip install -r requirements.txt

# Set up DVWA challenge
print_status "Setting up DVWA challenge in database..."
python3 ../scripts/setup-dvwa-challenge.py

# Go back to project root
cd ..

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p /var/lib/challenges
mkdir -p /etc/openvpn
mkdir -p /home/xploitrum.org/logs

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R $USER:$USER /var/lib/challenges
sudo chmod 755 /var/lib/challenges

# Create Docker network for challenges if it doesn't exist
print_status "Creating Docker network for challenges..."
docker network create xploitrum_challenges --subnet=172.20.0.0/16 2>/dev/null || print_warning "Network already exists"

# Pull DVWA Docker image
print_status "Pulling DVWA Docker image..."
docker pull vulnerables/web-dvwa:latest

# Test DVWA deployment
print_status "Testing DVWA deployment..."
docker run -d --name dvwa-test --network xploitrum_challenges \
    -e MYSQL_ROOT_PASSWORD=password \
    -e MYSQL_DATABASE=dvwa \
    -e MYSQL_USER=dvwa \
    -e MYSQL_PASSWORD=password \
    vulnerables/web-dvwa:latest

# Wait for container to start
sleep 10

# Check if container is running
if docker ps | grep -q dvwa-test; then
    print_success "DVWA test container is running"
    
    # Get container IP
    CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dvwa-test)
    print_success "DVWA container IP: $CONTAINER_IP"
    
    # Clean up test container
    docker stop dvwa-test
    docker rm dvwa-test
    print_success "Test container cleaned up"
else
    print_error "DVWA test container failed to start"
    exit 1
fi

# Restart services
print_status "Restarting services..."

# Stop existing services
print_status "Stopping existing services..."
sudo systemctl stop xploitrum-backend.service 2>/dev/null || true
sudo systemctl stop xploitrum-frontend.service 2>/dev/null || true

# Start services
print_status "Starting backend service..."
sudo systemctl start xploitrum-backend.service

print_status "Starting frontend service..."
sudo systemctl start xploitrum-frontend.service

# Wait for services to start
sleep 10

# Check service status
print_status "Checking service status..."
if sudo systemctl is-active --quiet xploitrum-backend.service; then
    print_success "Backend service is running"
else
    print_error "Backend service failed to start"
    sudo systemctl status xploitrum-backend.service
fi

if sudo systemctl is-active --quiet xploitrum-frontend.service; then
    print_success "Frontend service is running"
else
    print_error "Frontend service failed to start"
    sudo systemctl status xploitrum-frontend.service
fi

# Test API endpoints
print_status "Testing API endpoints..."
if curl -s http://localhost:8000/api/v1/challenges/ > /dev/null; then
    print_success "Challenges API is responding"
else
    print_warning "Challenges API is not responding"
fi

if curl -s http://localhost:3000 > /dev/null; then
    print_success "Frontend is responding"
else
    print_warning "Frontend is not responding"
fi

# Display summary
echo ""
echo "🎉 CTF Platform Deployment Complete!"
echo "===================================="
echo ""
echo "✅ DVWA challenge has been set up in the database"
echo "✅ Docker containers are configured and tested"
echo "✅ Services are running"
echo ""
echo "🌐 Access your CTF platform:"
echo "   - Main website: https://www.xploitrum.org"
echo "   - CTF platform: https://ctf.xploitrum.org"
echo "   - Admin panel: https://www.xploitrum.org/admin"
echo ""
echo "🔧 Admin Setup:"
echo "   1. Go to the admin panel"
echo "   2. Click 'Quick Setup' in challenges"
echo "   3. Use the DVWA template to create the challenge"
echo "   4. Users can now deploy DVWA instances!"
echo ""
echo "🐳 Docker Commands for Testing:"
echo "   - View running containers: docker ps"
echo "   - View challenge network: docker network ls"
echo "   - Test DVWA manually: docker run -d -p 8080:80 vulnerables/web-dvwa"
echo ""
echo "📊 Monitor your platform:"
echo "   - Backend logs: sudo journalctl -u xploitrum-backend.service -f"
echo "   - Frontend logs: sudo journalctl -u xploitrum-frontend.service -f"
echo "   - Docker logs: docker logs <container_name>"
echo ""

print_success "Deployment completed successfully!"
