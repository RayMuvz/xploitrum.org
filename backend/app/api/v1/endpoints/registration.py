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

def _read_registration_setting() -> bool:
    """Read registration setting from settings.json"""
    import json
    from pathlib import Path
    # Path from backend/app/api/v1/endpoints/registration.py to backend/settings.json
    settings_path = Path(__file__).parent.parent.parent.parent.parent / "settings.json"
    
    if settings_path.exists():
        try:
            with open(settings_path, 'r') as f:
                settings = json.load(f)
            return settings.get("registration_enabled", True)
        except (json.JSONDecodeError, IOError):
            return True  # Default to enabled if file is corrupted
    else:
        return True  # Default to enabled if file doesn't exist


@router.post("/register")
async def register_student(registration: StudentRegistration):
    """
    Handle student organization registration
    Sends email to admin with registration details and CSV attachment
    """
    # Check if registration is enabled globally
    if not _read_registration_setting():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is currently closed. Please contact the administrator."
        )
    
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
        
        # Validate SMTP configuration
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SMTP credentials not configured. Please set SMTP_USERNAME and SMTP_PASSWORD environment variables."
            )
        
        if not settings.SMTP_HOST:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SMTP server not configured. Please set SMTP_HOST environment variable."
            )
        
        # Determine if we should use SSL or STARTTLS
        # If SMTP_SSL is explicitly set, use it; otherwise infer from port
        # Port 465 typically uses SSL, port 587 uses STARTTLS
        if hasattr(settings, 'SMTP_SSL') and settings.SMTP_SSL is not None:
            use_ssl = settings.SMTP_SSL
        else:
            use_ssl = settings.SMTP_PORT == 465
        
        # STARTTLS is used when TLS is enabled but SSL is not (and port is typically 587)
        use_starttls = not use_ssl and settings.SMTP_TLS and settings.SMTP_PORT != 465
        
        # Configure email
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USERNAME,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_HOST,
            MAIL_STARTTLS=use_starttls,
            MAIL_SSL_TLS=use_ssl,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            TIMEOUT=10  # 10 second timeout
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
        
        # Try to send email, but fall back to saving to file if it fails
        email_sent = False
        try:
            fm = FastMail(conf)
            
            # Send admin notification first
            await fm.send_message(admin_message)
            print(f"✅ Admin notification sent for {registration.firstName} {registration.lastName}")
            
            # Send student confirmation
            await fm.send_message(student_message)
            print(f"✅ Confirmation email sent to {email_value}")
            
            email_sent = True
        except Exception as email_error:
            # Log detailed error information for debugging
            error_msg = str(email_error)
            print(f"⚠️ Failed to send email: {error_msg}")
            print(f"   SMTP Server: {settings.SMTP_HOST}")
            print(f"   SMTP Port: {settings.SMTP_PORT}")
            print(f"   SMTP Username: {settings.SMTP_USERNAME}")
            print(f"   Use SSL: {use_ssl}, Use STARTTLS: {use_starttls}")
            print(f"   Registration will be saved to file instead")
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
        
        # If email failed, save to file as backup
        if not email_sent:
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
                # If both email and file save fail, raise an error
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send email and save registration. Please contact support."
                )
        
        # Registration succeeded (either email sent or saved to file)
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
