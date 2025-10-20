#!/bin/bash
# XploitRUM Platform - Universal Startup Script
# Works on Linux, macOS, and Windows (Git Bash/WSL)

set -e  # Exit on error

echo "========================================="
echo "XploitRUM CTF Platform Startup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    if command_exists lsof; then
        lsof -i :$1 >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -an | grep ":$1" | grep -q LISTEN
    else
        return 1
    fi
}

# Check prerequisites
echo "[1/6] Checking prerequisites..."
echo ""

if ! command_exists python3 && ! command_exists python; then
    echo -e "${RED}ERROR: Python is not installed${NC}"
    echo "Please install Python 3.10+ from https://www.python.org/"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Determine Python command
if command_exists python3; then
    PYTHON_CMD=python3
    PIP_CMD=pip3
else
    PYTHON_CMD=python
    PIP_CMD=pip
fi

echo -e "${GREEN}✓ Python found: $($PYTHON_CMD --version)${NC}"
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
echo ""

# Check if ports are available
echo "[2/6] Checking ports..."
echo ""

if port_in_use 8000; then
    echo -e "${YELLOW}⚠ Port 8000 is already in use${NC}"
    echo "Please stop the process using port 8000 or change the backend port"
    exit 1
fi

if port_in_use 3000; then
    echo -e "${YELLOW}⚠ Port 3000 is already in use${NC}"
    echo "Please stop the process using port 3000 or change the frontend port"
    exit 1
fi

echo -e "${GREEN}✓ Ports 8000 and 3000 are available${NC}"
echo ""

# Create environment files if they don't exist
echo "[3/6] Setting up environment files..."
echo ""

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    cat > backend/.env << 'EOF'
APP_NAME=XploitRUM CTF Platform
APP_ENV=production
DEBUG=False
API_VERSION=v1
HOST=0.0.0.0
PORT=8000
RELOAD=False
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=sqlite:///./xploitrum.db
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:3000,https://xploitrum.org,https://www.xploitrum.org
RATE_LIMIT_PER_MINUTE=60
DEFAULT_INSTANCE_TIMEOUT=7200
MAX_INSTANCES_PER_USER=5
MAX_INSTANCES_PER_CHALLENGE=50
LOG_LEVEL=INFO
EOF
    echo -e "${GREEN}✓ Created backend/.env${NC}"
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend/.env.local..."
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_APP_NAME=XploitRUM CTF Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_REGISTRATION=true
NEXT_PUBLIC_ENABLE_CTF=true
NEXT_PUBLIC_ENABLE_EVENTS=true
EOF
    echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
else
    echo -e "${GREEN}✓ frontend/.env.local already exists${NC}"
fi
echo ""

# Install dependencies
echo "[4/6] Installing dependencies..."
echo ""

# Backend dependencies
echo "Installing backend dependencies..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi

$PIP_CMD install -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Create necessary directories
mkdir -p logs static uploads
echo -e "${GREEN}✓ Created backend directories${NC}"

cd ..

# Frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

echo ""

# Start servers
echo "[5/6] Starting servers..."
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi

nohup $PYTHON_CMD -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo ""
echo "Starting frontend server..."
cd frontend
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "  Website: http://localhost:3000"

echo ""
echo "========================================="
echo "✓ All servers started successfully!"
echo "========================================="
echo ""
echo "Access the platform:"
echo "  • Website: http://localhost:3000"
echo "  • Backend API: http://localhost:8000"
echo "  • API Documentation: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  • Backend: logs/backend.log"
echo "  • Frontend: logs/frontend.log"
echo ""
echo "To stop all servers, run: ./stop.sh"
echo ""

# Keep script running and show logs
echo "[6/6] Tailing logs (Ctrl+C to stop viewing, servers will keep running)..."
echo ""
sleep 2
tail -f logs/backend.log logs/frontend.log

