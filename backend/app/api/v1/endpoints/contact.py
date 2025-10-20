"""
XploitRUM CTF Platform - Contact Endpoints
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings

router = APIRouter()

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("/contact")
async def send_contact_message(contact: ContactMessage):
    """
    Send a contact form message to admin email
    """
    try:
        # Prepare email content
        subject = f"Contact Form Submission from {contact.name}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #00d9ff; border-bottom: 2px solid #00d9ff; padding-bottom: 10px;">
                        New Contact Form Submission
                    </h2>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Name:</strong> {contact.name}</p>
                        <p><strong>Email:</strong> {contact.email}</p>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 20px;">Message:</h3>
                    <div style="background: #fff; border-left: 4px solid #00d9ff; padding: 15px; margin: 10px 0;">
                        <p style="white-space: pre-wrap;">{contact.message}</p>
                    </div>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    
                    <p style="color: #666; font-size: 12px;">
                        This message was sent via the XploitRUM contact form.<br>
                        Reply directly to {contact.email} to respond.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Configure email
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USERNAME or "noreply@xploitrum.org",
            MAIL_PASSWORD=settings.SMTP_PASSWORD or "",
            MAIL_FROM=settings.FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_HOST or "smtp.gmail.com",
            MAIL_STARTTLS=settings.SMTP_TLS,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD),
            VALIDATE_CERTS=True
        )
        
        # Create admin email message
        admin_message = MessageSchema(
            subject=subject,
            recipients=["admin@xploitrum.org"],
            body=html_body,
            subtype="html"
        )
        
        # Try to send email
        email_configured = bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD)
        
        if email_configured:
            try:
                fm = FastMail(conf)
                await fm.send_message(admin_message)
                print(f"✅ Contact email sent to admin@xploitrum.org from {contact.email}")
                
                return {
                    "message": "Your message has been sent successfully. We'll get back to you soon!",
                    "email_sent": True
                }
            except Exception as email_error:
                print(f"⚠️ Failed to send email: {email_error}")
                # Don't fail the request, just log the message
                print(f"📧 Contact message logged (email delivery failed):")
                print(f"   From: {contact.name} <{contact.email}>")
                print(f"   Message: {contact.message}")
                
                return {
                    "message": "Message received. We'll get back to you soon!",
                    "email_sent": False,
                    "note": "Email delivery temporarily unavailable, but message was logged"
                }
        else:
            # Development mode - log to console
            print("⚠️ Email not configured. Contact message logged:")
            print(f"From: {contact.name} <{contact.email}>")
            print(f"Message: {contact.message}")
            
            return {
                "message": "Message received (email not configured in development mode)",
                "email_sent": False
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing contact form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )

