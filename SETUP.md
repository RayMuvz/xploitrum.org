# 🚀 Setup Instructions

## Quick Start - Choose Your Method

### Method 1: npm Scripts (Recommended - All Platforms)

```bash
# Install the concurrently package globally (one-time)
npm install -g concurrently

# Install all dependencies
npm run setup

# Start both servers in development mode
npm run dev
```

**That's it!** Both servers will start automatically.
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Method 2: Start Script (Linux/macOS/WSL/Git Bash)

```bash
# Make script executable
chmod +x start.sh

# Run the script
./start.sh
```

The script will:
1. Check prerequisites (Node.js, Python)
2. Create environment files
3. Install dependencies
4. Start both servers
5. Show logs

### Method 3: Manual (All Platforms)

**Terminal 1 - Backend:**
```bash
cd backend

# Create virtual environment (first time only)
python3 -m venv venv  # or: python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << 'EOF'
APP_NAME=XploitRUM CTF Platform
DATABASE_URL=sqlite:///./xploitrum.db
JWT_SECRET_KEY=dev-secret-key-12345678
CORS_ORIGINS=http://localhost:3000
HOST=0.0.0.0
PORT=8000
EOF

# Start backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Start frontend
npm run dev
```

## Production Deployment

For production deployment to DigitalOcean or any Linux server, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Stopping Servers

### If using start.sh:
```bash
./stop.sh
```

### If using npm:
Press `Ctrl+C` in the terminal running `npm run dev`

### If manual:
Press `Ctrl+C` in each terminal window

## Available npm Scripts

```bash
npm run dev              # Start both servers in development mode
npm run start            # Start both servers in production mode
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run start:backend    # Start backend (production)
npm run start:frontend   # Start frontend (production)
npm run setup            # Install all dependencies
npm run build            # Build frontend for production
```

## Environment Variables

### Backend (.env)
Required variables:
- `DATABASE_URL` - Database connection string
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `CORS_ORIGINS` - Allowed origins for CORS

### Frontend (.env.local)
Required variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend URL

## Troubleshooting

**Error: Command not found**
- Make sure Node.js and Python are installed and in PATH
- Try `node --version` and `python --version`

**Error: Port already in use**
- Backend (8000): Another process is using port 8000
- Frontend (3000): Another process is using port 3000
- Kill the process or change the port in environment variables

**Error: Module not found**
- Run `npm run setup` to install all dependencies
- Or manually install backend and frontend dependencies

**Error: Permission denied (start.sh)**
- Run `chmod +x start.sh` to make the script executable

## Next Steps

1. ✅ Start the servers using one of the methods above
2. ✅ Visit http://localhost:3000 to see the website
3. ✅ Visit http://localhost:8000/docs to see API documentation
4. ✅ Create an admin account (see README.md)
5. ✅ Explore the platform and customize as needed
6. ✅ Deploy to production when ready (see DEPLOYMENT.md)

---

**Need Help?** Check README.md for more information or review the logs for error messages.

