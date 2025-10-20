# Fix Backend Installation

## Issue
The backend requires `pydantic-settings` package which is not installed in your virtual environment.

## Solution (For WSL/Linux)

Run these commands in your WSL terminal:

```bash
cd /mnt/c/Users/chris/OneDrive/Documents/'Xploit RUM'/xploitrum.org/backend

# Activate virtual environment
source venv/bin/activate

# Install missing packages
pip install pydantic-settings==2.2.0 email-validator==2.1.0

# Or reinstall all requirements
pip install -r requirements.txt

# Start the backend
python -m uvicorn app.main:app --reload
```

## Alternative: Recreate Virtual Environment

If you continue to have issues, recreate the virtual environment:

```bash
cd /mnt/c/Users/chris/OneDrive/Documents/'Xploit RUM'/xploitrum.org/backend

# Remove old venv
rm -rf venv

# Create new venv
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install all packages
pip install --upgrade pip
pip install -r requirements.txt

# Start backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Verify Installation

Check if packages are installed:

```bash
source venv/bin/activate
pip list | grep pydantic
```

You should see:
- pydantic
- pydantic-settings
- pydantic_core

## Start Backend

Once packages are installed:

```bash
cd /mnt/c/Users/chris/OneDrive/Documents/'Xploit RUM'/xploitrum.org/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

## Start Frontend (Separate Terminal)

```bash
cd /mnt/c/Users/chris/OneDrive/Documents/'Xploit RUM'/xploitrum.org/frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:3000

