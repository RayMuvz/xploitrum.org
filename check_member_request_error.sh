#!/bin/bash
echo "=== Checking Member Request Error ==="
echo ""

echo "1. Checking backend logs for member request errors..."
journalctl -u xploitrum-backend -n 50 --no-pager | grep -A 5 -B 5 "member-request"

echo ""
echo "2. Checking if member_requests table exists in database..."
cd /home/xploitrum.org/backend
source venv/bin/activate
python -c "from app.core.database import engine; from sqlalchemy import inspect; tables = inspect(engine).get_table_names(); print('member_requests' in tables)"

echo ""
echo "=== Diagnostic Complete ==="

