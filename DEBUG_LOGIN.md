# Debugging Production Login Issues

## Current Error
```
POST https://api.xploitrum.org/api/v1/auth/login 401 (Unauthorized)
```

## Troubleshooting Steps

### 1. Check Backend Service Status
```bash
systemctl status xploitrum-backend
```

### 2. Check Backend Logs for Login Attempts
```bash
journalctl -u xploitrum-backend -f
```

### 3. Test Login API Directly
```bash
curl -X POST https://api.xploitrum.org/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=your_password"
```

### 4. Check Database Connection
```bash
cd /home/xploitrum.org/backend
source venv/bin/activate
python -c "from app.core.database import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"
```

### 5. Verify Environment Variables
```bash
cd /home/xploitrum.org/backend
source venv/bin/activate
python -c "from app.core.config import settings; print(f'SECRET_KEY: {settings.SECRET_KEY[:20]}...'); print(f'DATABASE_URL: {settings.DATABASE_URL[:30]}...')"
```

## Common Causes

### Issue 1: Database Not Connected
**Symptom**: Backend starts but can't query users
**Fix**: Check `DATABASE_URL` in `/home/xploitrum.org/backend/.env`

### Issue 2: User Doesn't Exist in Database
**Symptom**: 401 for all users
**Fix**: Create admin user:
```bash
cd /home/xploitrum.org/backend
source venv/bin/activate
python create_admin.py
```

### Issue 3: Password Hash Mismatch
**Symptom**: Backend logs show authentication failure
**Fix**: User password was changed manually in database without rehashing

### Issue 4: Frontend Sending Wrong Format
**Symptom**: Backend receives malformed request
**Fix**: Check browser Network tab for actual request payload

## Quick Fix Commands

### Restart All Services
```bash
sudo systemctl restart xploitrum-backend
sudo systemctl restart xploitrum-frontend
sudo systemctl reload nginx
```

### Check Real-time Logs
```bash
# Backend logs
journalctl -u xploitrum-backend -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Reset Admin Password
```bash
cd /home/xploitrum.org/backend
source venv/bin/activate
python create_admin.py
# Follow prompts to set new admin password
```

## Expected Login Request Format

From frontend:
```javascript
// In AuthContext.tsx
const response = await axios.post(
  'https://api.xploitrum.org/api/v1/auth/login',
  `username=${username}&password=${password}`,
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);
```

Backend expects (OAuth2PasswordRequestForm):
```
username=admin
password=your_password
```

## Check CORS Configuration

Verify `/home/xploitrum.org/backend/.env` has:
```env
CORS_ORIGINS=https://xploitrum.org,https://www.xploitrum.org,https://api.xploitrum.org
```

