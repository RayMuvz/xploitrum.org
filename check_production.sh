#!/bin/bash
echo "=== XploitRUM Production Diagnostic ==="
echo ""

echo "1. Checking backend service status..."
systemctl status xploitrum-backend --no-pager

echo ""
echo "2. Last 20 lines of backend logs..."
journalctl -u xploitrum-backend -n 20 --no-pager

echo ""
echo "3. Checking if admin user exists..."
cd /home/xploitrum.org/backend
source venv/bin/activate
python -c "from app.core.database import get_db; from app.models.user import User; db = next(get_db()); users = db.query(User).all(); print(f'Total users: {len(users)}'); [print(f'  - {u.username} ({u.email}) - Role: {u.role}') for u in users]"

echo ""
echo "4. Testing database connection..."
python -c "from app.core.database import engine; from sqlalchemy import text; conn = engine.connect(); result = conn.execute(text('SELECT 1')); print('Database connection: OK')"

echo ""
echo "5. Checking environment variables..."
python -c "from app.core.config import settings; print(f'SECRET_KEY set: {bool(settings.SECRET_KEY)}'); print(f'DATABASE_URL: {settings.DATABASE_URL[:50]}...')"

echo ""
echo "=== Diagnostic Complete ==="

