"""
Test SMTP configuration on production
Run this on your droplet: python test_smtp.py
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

print("=== SMTP Configuration Check ===")
print(f"SMTP_HOST: {settings.SMTP_HOST}")
print(f"SMTP_SERVER: {settings.SMTP_SERVER}")
print(f"SMTP_PORT: {settings.SMTP_PORT}")
print(f"SMTP_USERNAME: {settings.SMTP_USERNAME}")
print(f"SMTP_PASSWORD: {'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 'NOT SET'}")
print(f"SMTP_TLS: {settings.SMTP_TLS}")
print(f"FROM_EMAIL: {settings.FROM_EMAIL}")

if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
    print("\n❌ ERROR: SMTP_USERNAME or SMTP_PASSWORD not set in .env file")
    sys.exit(1)

print("\n✅ Email configuration looks good!")
print("\nTesting connection...")

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

smtp_server = settings.SMTP_HOST or settings.SMTP_SERVER or 'smtp.gmail.com'

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USERNAME,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=smtp_server,
    MAIL_STARTTLS=settings.SMTP_TLS,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@xploitrum.org')

message = MessageSchema(
    subject="Test Email from XploitRUM",
    recipients=[admin_email],
    body="This is a test email to verify SMTP configuration is working.",
    subtype="html"
)

print(f"Attempting to send test email to {admin_email}...")
print(f"Using SMTP server: {smtp_server}:{settings.SMTP_PORT}")

try:
    import asyncio
    fm = FastMail(conf)
    asyncio.run(fm.send_message(message))
    print("✅ Email sent successfully!")
except Exception as e:
    print(f"❌ Failed to send email: {e}")
    import traceback
    traceback.print_exc()

