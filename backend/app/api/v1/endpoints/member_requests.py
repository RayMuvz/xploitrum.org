"""
XploitRUM CTF Platform - Member Requests Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid
import secrets
import string
import asyncio
import threading

from app.core.database import get_db
from app.core.auth import get_current_admin_user
from app.models.member_request import MemberRequest, MemberRequestStatus
from app.models.user import User, UserRole
from app.core.exceptions import ValidationError, NotFoundError
from app.core.auth import get_password_hash
from app.core.config import settings
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi import BackgroundTasks

router = APIRouter()


async def send_member_acceptance_email(email: str, username: str, temp_password: str, first_name: str):
    """Send email to user when their member request is accepted"""
    try:
        # Check if email is configured
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            print(f"📧 Email not configured (missing SMTP_USERNAME or SMTP_PASSWORD)")
            print(f"   Username: {username}, Password: {temp_password}, Email: {email}")
            return
        
        print(f"📧 Attempting to send acceptance email to {email}")
        smtp_server = settings.SMTP_HOST or settings.SMTP_SERVER or 'smtp.gmail.com'
        print(f"   SMTP Server: {smtp_server}")
        print(f"   SMTP Port: {settings.SMTP_PORT}")
        print(f"   SMTP User: {settings.SMTP_USERNAME}")
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #00d9ff; border-bottom: 2px solid #00d9ff; padding-bottom: 10px;">
                        Welcome to XploitRUM!
                    </h2>
                    
                    <p>Hello {first_name},</p>
                    
                    <p>Great news! Your member account request has been approved. Your XploitRUM account has been created.</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Username:</strong> {username}</p>
                        <p style="margin: 10px 0 0 0;"><strong>Temporary Password:</strong> {temp_password}</p>
                    </div>
                    
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404;">
                            <strong>⚠️ Important:</strong> You must change your password after your first login.
                        </p>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Go to <a href="https://www.xploitrum.org/login">https://www.xploitrum.org/login</a></li>
                        <li>Log in with the credentials above</li>
                        <li>You will be prompted to change your password</li>
                    </ol>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    
                    <p style="color: #666; font-size: 12px;">
                        If you did not request this account, please contact admin@xploitrum.org immediately.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Use TLS for port 587, SSL for port 465
        use_ssl = settings.SMTP_PORT == 465
        
        # Support both SMTP_HOST and SMTP_SERVER from .env
        smtp_server = settings.SMTP_HOST or settings.SMTP_SERVER or "smtp.gmail.com"
        
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USERNAME,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=smtp_server,
            MAIL_STARTTLS=not use_ssl and settings.SMTP_TLS,
            MAIL_SSL_TLS=use_ssl,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        
        message = MessageSchema(
            subject="Your XploitRUM Member Account Request Has Been Accepted",
            recipients=[email],
            body=html_body,
            subtype="html"
        )
        
        try:
            fm = FastMail(conf)
            await asyncio.wait_for(fm.send_message(message), timeout=10.0)
            print(f"✅ Acceptance email sent successfully to {email}")
        except asyncio.TimeoutError:
            print(f"⚠️ Email send timeout to {email}")
        except Exception as send_error:
            print(f"⚠️ Email send failed to {email}: {type(send_error).__name__}: {send_error}")
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        import traceback
        print(f"⚠️ Failed to send email to {email}: {type(e).__name__}: {e}")
        traceback.print_exc()


async def send_member_decline_email(email: str, first_name: str, notes: Optional[str] = None):
    """Send email to user when their member request is declined"""
    try:
        # Check if email is configured
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            print(f"📧 Email not configured (missing SMTP_USERNAME or SMTP_PASSWORD)")
            print(f"   Would send decline notification to {email}")
            return
        
        print(f"📧 Attempting to send decline email to {email}")
        
        decline_reason = f"<p><strong>Reason:</strong> {notes}</p>" if notes else ""
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
                        Member Account Request Decision
                    </h2>
                    
                    <p>Hello {first_name},</p>
                    
                    <p>We regret to inform you that your member account request for XploitRUM has been declined at this time.</p>
                    
                    {decline_reason}
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Questions?</strong></p>
                        <p style="margin: 5px 0 0 0;">If you have any questions about this decision, please contact us at admin@xploitrum.org</p>
                    </div>
                    
                    <p>Thank you for your interest in XploitRUM.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from XploitRUM CTF Platform.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Use TLS for port 587, SSL for port 465
        use_ssl = settings.SMTP_PORT == 465
        
        # Support both SMTP_HOST and SMTP_SERVER from .env
        smtp_server = settings.SMTP_HOST or settings.SMTP_SERVER or "smtp.gmail.com"
        
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USERNAME,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=smtp_server,
            MAIL_STARTTLS=not use_ssl and settings.SMTP_TLS,
            MAIL_SSL_TLS=use_ssl,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        
        message = MessageSchema(
            subject="Update on Your XploitRUM Member Account Request",
            recipients=[email],
            body=html_body,
            subtype="html"
        )
        
        try:
            fm = FastMail(conf)
            await asyncio.wait_for(fm.send_message(message), timeout=10.0)
            print(f"✅ Decline email sent successfully to {email}")
        except asyncio.TimeoutError:
            print(f"⚠️ Email send timeout to {email}")
        except Exception as send_error:
            print(f"⚠️ Email send failed to {email}: {type(send_error).__name__}: {send_error}")
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        import traceback
        print(f"⚠️ Failed to send email to {email}: {type(e).__name__}: {e}")
        traceback.print_exc()


class MemberRequestCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    student_number: Optional[str] = None


class MemberRequestResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    student_number: Optional[str]
    status: str
    created_at: str
    reviewed_by: Optional[str]
    reviewed_at: Optional[str]


class MemberRequestUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "user"


@router.post("/submit", response_model=dict)
async def submit_member_request(
    request_data: MemberRequestCreate,
    db: Session = Depends(get_db)
):
    """Submit a new member request"""
    try:
        # Validate email domain
        if not request_data.email.endswith("@upr.edu"):
            raise ValidationError("Email must be an institutional email (@upr.edu)")
        
        # Check if user already exists
        existing_user = db.execute(
            select(User).where(User.email == request_data.email)
        ).scalar_one_or_none()
        
        if existing_user:
            raise ValidationError("An account with this email already exists. Please try logging in instead.")
        
        # Check if email already exists in requests
        existing_request = db.execute(
            select(MemberRequest).where(MemberRequest.email == request_data.email)
        ).scalar_one_or_none()
        
        if existing_request:
            if existing_request.status == MemberRequestStatus.PENDING:
                raise ValidationError("A request with this email is already pending. Please wait for review.")
            elif existing_request.status == MemberRequestStatus.ACCEPTED:
                # If no user exists with this email, the account was likely deleted - allow re-request
                check_user = db.execute(
                    select(User).where(User.email == request_data.email)
                ).scalar_one_or_none()
                
                if not check_user:
                    # Update the old request to a new pending request
                    existing_request.status = MemberRequestStatus.PENDING
                    existing_request.first_name = request_data.first_name
                    existing_request.last_name = request_data.last_name
                    existing_request.phone = request_data.phone
                    existing_request.student_number = request_data.student_number
                    existing_request.notes = None
                    existing_request.reviewed_by = None
                    existing_request.reviewed_at = None
                    
                    db.commit()
                    db.refresh(existing_request)
                    
                    return {
                        "message": "Member request resubmitted successfully",
                        "request_id": existing_request.id
                    }
                else:
                    raise ValidationError("An account with this email already exists. Please try logging in instead.")
            elif existing_request.status == MemberRequestStatus.DECLINED:
                raise ValidationError("A previous request with this email was declined. Please contact admin@xploitrum.org for more information.")
        
        # Create new member request
        new_request = MemberRequest(
            id=str(uuid.uuid4()),
            first_name=request_data.first_name,
            last_name=request_data.last_name,
            email=request_data.email,
            phone=request_data.phone,
            student_number=request_data.student_number,
            status=MemberRequestStatus.PENDING
        )
        
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        return {
            "message": "Member request submitted successfully",
            "request_id": new_request.id
        }
        
    except ValidationError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ve.message
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit request: {str(e)}"
        )


@router.get("/", response_model=List[MemberRequestResponse])
async def get_member_requests(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all member requests (admin only)"""
    try:
        query = select(MemberRequest)
        
        if status_filter:
            query = query.where(MemberRequest.status == status_filter)
        
        result = db.execute(query.order_by(MemberRequest.created_at.desc()))
        requests = result.scalars().all()
        
        return [
            MemberRequestResponse(
                id=req.id,
                first_name=req.first_name,
                last_name=req.last_name,
                email=req.email,
                phone=req.phone,
                student_number=req.student_number,
                status=req.status.value,
                created_at=req.created_at.isoformat(),
                reviewed_by=req.reviewed_by,
                reviewed_at=req.reviewed_at.isoformat() if req.reviewed_at else None
            )
            for req in requests
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get member requests"
        )


@router.put("/{request_id}/accept", response_model=dict)
async def accept_member_request(
    request_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Accept a member request and create user account (admin only)"""
    try:
        # Get request
        request = db.execute(
            select(MemberRequest).where(MemberRequest.id == request_id)
        ).scalar_one_or_none()
        
        if not request:
            raise NotFoundError("Request not found")
        
        if request.status != MemberRequestStatus.PENDING:
            raise ValidationError("Request is not in pending status")
        
        # Check if user already exists
        existing_user = db.execute(
            select(User).where(User.email == request.email)
        ).scalar_one_or_none()
        
        if existing_user:
            raise ValidationError("User with this email already exists")
        
        # Generate temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
        
        # Create username from email
        username = request.email.split("@")[0]
        
        # Check if username exists
        username_check = db.execute(
            select(User).where(User.username == username)
        ).scalar_one_or_none()
        
        if username_check:
            username = f"{username}{secrets.randbelow(1000)}"
        
        # Create new user
        hashed_password = get_password_hash(temp_password)
        new_user = User(
            username=username,
            email=request.email,
            password_hash=hashed_password,
            full_name=f"{request.first_name} {request.last_name}",
            role=UserRole.USER,
            email_verified=False,  # They need to change password on first login
            must_change_password=True  # Force password change on first login
        )
        
        db.add(new_user)
        
        # Update request status
        request.status = MemberRequestStatus.ACCEPTED
        request.reviewed_by = current_user.username
        request.reviewed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(new_user)
        db.refresh(request)
        
        # Send email notification in background (non-blocking)
        # Use a separate thread to avoid blocking the response
        import threading
        threading.Thread(
            target=lambda: asyncio.run(send_member_acceptance_email(request.email, new_user.username, temp_password, request.first_name)),
            daemon=True
        ).start()
        
        print(f"User created: {new_user.email}, temp password: {temp_password}")
        
        return {
            "message": "Member request accepted",
            "user_id": new_user.id,
            "username": new_user.username,
            "temp_password": temp_password  # In production, this should be sent via email only
        }
        
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept request: {str(e)}"
        )


@router.put("/{request_id}/decline", response_model=dict)
async def decline_member_request(
    request_id: str,
    background_tasks: BackgroundTasks,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Decline a member request (admin only)"""
    try:
        # Get request
        request = db.execute(
            select(MemberRequest).where(MemberRequest.id == request_id)
        ).scalar_one_or_none()
        
        if not request:
            raise NotFoundError("Request not found")
        
        if request.status != MemberRequestStatus.PENDING:
            raise ValidationError("Request is not in pending status")
        
        # Update request status
        request.status = MemberRequestStatus.DECLINED
        request.reviewed_by = current_user.username
        request.reviewed_at = datetime.utcnow()
        request.notes = notes
        
        db.commit()
        db.refresh(request)
        
        # Send email notification in background (non-blocking)
        # Use a separate thread to avoid blocking the response
        import threading
        threading.Thread(
            target=lambda: asyncio.run(send_member_decline_email(request.email, request.first_name, notes)),
            daemon=True
        ).start()
        
        print(f"Request declined for: {request.email}")
        
        return {
            "message": "Member request declined"
        }
        
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decline request: {str(e)}"
        )

