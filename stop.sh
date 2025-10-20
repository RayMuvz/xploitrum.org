#!/bin/bash
# XploitRUM Platform - Stop Script

echo "========================================="
echo "Stopping XploitRUM CTF Platform"
echo "========================================="
echo ""

# Function to kill process by PID file
kill_by_pid_file() {
    if [ -f "$1" ]; then
        PID=$(cat "$1")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Stopping $2 (PID: $PID)..."
            kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
            echo "✓ $2 stopped"
        else
            echo "⚠ $2 process not running"
        fi
        rm "$1"
    else
        echo "⚠ No PID file found for $2"
    fi
}

# Kill by PID files
kill_by_pid_file "backend.pid" "Backend"
kill_by_pid_file "frontend.pid" "Frontend"

# Also kill by port (fallback)
echo ""
echo "Checking for any remaining processes on ports 8000 and 3000..."

if command -v lsof >/dev/null 2>&1; then
    # Kill process on port 8000
    PID_8000=$(lsof -ti:8000)
    if [ ! -z "$PID_8000" ]; then
        echo "Killing process on port 8000 (PID: $PID_8000)..."
        kill $PID_8000 2>/dev/null || kill -9 $PID_8000 2>/dev/null
    fi

    # Kill process on port 3000
    PID_3000=$(lsof -ti:3000)
    if [ ! -z "$PID_3000" ]; then
        echo "Killing process on port 3000 (PID: $PID_3000)..."
        kill $PID_3000 2>/dev/null || kill -9 $PID_3000 2>/dev/null
    fi
fi

echo ""
echo "✓ All servers stopped"
echo ""

