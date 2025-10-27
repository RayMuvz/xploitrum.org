"""
Background task service for async operations
"""
from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings
import asyncio

async def send_email_background(
    subject: str,
    recipients: list,
    body: str,
    subtype: str = "html"
):
    """
    Send email in background task (non-blocking)
    """
    try:
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            print(f"📧 Email not configured, skipping send to {', '.join(recipients)}")
            return
        
        # Get SMTP server from config
        smtp_server = settings.SMTP_HOST or settings.SMTP_SERVER or 'smtp.gmail.com'
        
        # Configure email connection
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USERNAME,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=smtp_server,
            MAIL_STARTTLS=settings.SMTP_TLS,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            TEMPLATE_FOLDER=None
        )
        
        # Create message
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=subtype
        )
        
        # Send with timeout
        fm = FastMail(conf)
        await asyncio.wait_for(fm.send_message(message), timeout=10.0)
        print(f"✅ Email sent successfully to {', '.join(recipients)}")
        
    except asyncio.TimeoutError:
        print(f"⚠️ Email send timeout to {', '.join(recipients)}")
    except Exception as e:
        print(f"⚠️ Failed to send email to {', '.join(recipients)}: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

