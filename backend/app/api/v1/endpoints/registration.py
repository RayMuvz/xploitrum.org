"""
Student Organization Registration Endpoints
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import csv
import io
from datetime import datetime

router = APIRouter()

class StudentRegistration(BaseModel):
    firstName: str
    lastName: str
    yearOfStudy: str
    major: str
    otherMajor: Optional[str] = None
    whyJoin: str
    lookingForward: str
    cybersecurityLevel: str
    emailPrefix: str
    studentNumber: str
    phoneNumber: str

@router.post("/register")
async def register_student(registration: StudentRegistration):
    """
    Handle student organization registration
    Sends email to admin with registration details and CSV attachment
    """
    try:
        # Create CSV content
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer)
        
        # Write headers
        csv_writer.writerow([
            'First Name', 'Last Name', 'Year of Study', 'Major', 
            'Why Join', 'Looking Forward', 'Cybersecurity Level',
            'Email', 'Student Number', 'Phone Number', 'Submitted At'
        ])
        
        # Write data
        major_value = registration.otherMajor if registration.major == 'Other' else registration.major
        email_value = f"{registration.emailPrefix}@upr.edu"
        
        csv_writer.writerow([
            registration.firstName,
            registration.lastName,
            registration.yearOfStudy,
            major_value,
            registration.whyJoin,
            registration.lookingForward,
            registration.cybersecurityLevel,
            email_value,
            registration.studentNumber,
            registration.phoneNumber,
            datetime.now().isoformat()
        ])
        
        csv_content = csv_buffer.getvalue()
        
        # Save CSV to temporary file for email attachment
        from pathlib import Path
        import tempfile
        temp_dir = Path(tempfile.gettempdir())
        temp_csv_file = temp_dir / f"registration_{registration.firstName}_{registration.lastName}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        with open(temp_csv_file, 'w', newline='', encoding='utf-8') as f:
            f.write(csv_content)
        
        # Create email body for admin
        admin_email_body = f"""
New Student Organization Registration Submitted

Student Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: {registration.firstName} {registration.lastName}
Email: {email_value}
Phone: {registration.phoneNumber}
Student Number: {registration.studentNumber}

Academic Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Year of Study: {registration.yearOfStudy}
Major: {major_value}

Cybersecurity Background:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Level: {registration.cybersecurityLevel}

Why They Want to Join:
{registration.whyJoin}

What They're Looking Forward To:
{registration.lookingForward}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}

A CSV file with this registration is attached.
"""
        
        # Create confirmation email body for student
        student_email_body = f"""
Dear {registration.firstName},

Thank you for your interest in joining XploitRUM!

We have successfully received your registration for the XploitRUM student organization. Here's a summary of your submission:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: {registration.firstName} {registration.lastName}
Email: {email_value}
Phone: {registration.phoneNumber}
Student Number: {registration.studentNumber}
Year of Study: {registration.yearOfStudy}
Major: {major_value}
Cybersecurity Level: {registration.cybersecurityLevel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What happens next?

1. Our team will review your application
2. You will receive a response within 24-48 hours
3. If accepted, you'll receive information about upcoming meetings and events

We're excited about your interest in cybersecurity and look forward to welcoming you to our community!

Best regards,
The XploitRUM Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated confirmation email.
If you have any questions, please contact us at admin@xploitrum.org
"""
        
        # Send email using fastapi-mail
        from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
        from app.core.config import settings
        
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
        
        # Create admin message
        admin_message = MessageSchema(
            subject=f"New XploitRUM Registration: {registration.firstName} {registration.lastName}",
            recipients=["admin@xploitrum.org"],
            body=admin_email_body,
            subtype="plain",
            attachments=[str(temp_csv_file)]  # fastapi-mail expects file path
        )
        
        # Create student confirmation message
        student_message = MessageSchema(
            subject="XploitRUM Registration Confirmation",
            recipients=[email_value],
            body=student_email_body,
            subtype="plain"
        )
        
        # Try to send email
        email_sent = False
        email_configured = bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD)
        
        try:
            if email_configured:
                fm = FastMail(conf)
                
                # Send admin notification
                await fm.send_message(admin_message)
                print(f"✅ Admin notification sent for {registration.firstName} {registration.lastName}")
                
                # Send student confirmation
                await fm.send_message(student_message)
                print(f"✅ Confirmation email sent to {email_value}")
                
                email_sent = True
            else:
                print("⚠️ Email credentials not configured, will save to file for development")
        except Exception as email_error:
            print(f"⚠️ Failed to send email: {email_error}")
            import traceback
            traceback.print_exc()
            email_sent = False
        finally:
            # Clean up temp file
            try:
                if temp_csv_file.exists():
                    temp_csv_file.unlink()
            except:
                pass
        
        # Only save to file in development (when email is not configured) or if email failed
        if not email_configured or not email_sent:
            try:
                from pathlib import Path
                registrations_dir = Path("registrations")
                registrations_dir.mkdir(exist_ok=True)
                
                filename = f"registration_{registration.firstName}_{registration.lastName}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                filepath = registrations_dir / filename
                
                with open(filepath, 'w', newline='', encoding='utf-8') as f:
                    f.write(csv_content)
                
                print(f"✅ Registration saved to file: {filepath}")
                
                # Also save a summary text file
                summary_file = registrations_dir / filename.replace('.csv', '_summary.txt')
                with open(summary_file, 'w', encoding='utf-8') as f:
                    f.write(admin_email_body)
                
                print(f"✅ Registration summary saved to: {summary_file}")
            except Exception as file_error:
                print(f"⚠️ Failed to save registration to file: {file_error}")
        
        # If email is configured but failed, raise an error
        if email_configured and not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send registration email. Please try again or contact support."
            )
        
        return {
            "success": True,
            "message": "Registration submitted successfully" + (" - confirmation email sent to you and admin" if email_sent else " - saved for admin review"),
            "email": email_value,
            "email_sent": email_sent
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process registration: {str(e)}"
        )
