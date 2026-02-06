"""
XploitRUM CTF Platform - Authentication Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_current_user,
    verify_token,
    _session_expired,
    cleanup_expired_sessions,
    oauth2_scheme,
    oauth2_scheme_optional,
)
from app.models.user import User
from app.models.session import Session
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError
from sqlalchemy import select, delete
import uuid

router = APIRouter()


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None  # JWT access token lifetime (seconds)
    idle_timeout_seconds: Optional[int] = None  # Session idle timeout (seconds)
    absolute_timeout_seconds: Optional[int] = None  # Max session lifetime (seconds)


class TokenRefresh(BaseModel):
    refresh_token: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """User login endpoint"""
    try:
        print(f"Login attempt - Username: {form_data.username}")  # Debug
        user = authenticate_user(db, form_data.username, form_data.password)
        
        if not user:
            print(f"Authentication failed for user: {form_data.username}")  # Debug
            raise AuthenticationError("Invalid username or password")
        
        print(f"User authenticated: {user.username}, Role: {user.role}")  # Debug
        
        if not user.is_active:
            raise AuthenticationError("Account is inactive")
        
        if user.is_locked:
            raise AuthenticationError("Account is temporarily locked")

        # Create server-side session (for idle + absolute timeout)
        session_id = str(uuid.uuid4())
        session = Session(
            id=session_id,
            user_id=user.id,
        )
        db.add(session)
        db.commit()

        token_data = {"sub": str(user.id), "session_id": session_id}
        access_token = create_access_token(data=token_data)
        refresh_token_value = create_refresh_token(data=token_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "idle_timeout_seconds": settings.SESSION_IDLE_TIMEOUT_MINUTES * 60,
            "absolute_timeout_seconds": settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES * 60,
        }
        
    except AuthenticationError as e:
        print(f"AuthenticationError: {e}")  # Debug
        raise
    except Exception as e:
        print(f"Login exception: {e}")  # Debug
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/register", response_model=dict)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """User registration endpoint"""
    try:
        # Check if user already exists
        from sqlalchemy import select
        stmt = select(User).where(
            (User.username == user_data.username) | (User.email == user_data.email)
        )
        result = db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValidationError("Username or email already exists")
        
        # Create new user
        from app.core.auth import get_password_hash
        hashed_password = get_password_hash(user_data.password)
        
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password,
            full_name=user_data.full_name
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "message": "User registered successfully",
            "user_id": new_user.id,
            "username": new_user.username
        }
        
    except ValidationError:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/refresh", response_model=Token)
def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
):
    """Refresh access token; validates server-side session and extends last_activity."""
    try:
        payload = verify_token(token_data.refresh_token)
        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        if not user_id:
            raise AuthenticationError("Invalid refresh token")
        if not session_id:
            raise AuthenticationError("Session required; please log in again")

        session = db.get(Session, session_id)
        if not session:
            raise AuthenticationError("Session expired")
        if _session_expired(session):
            db.execute(delete(Session).where(Session.id == session_id))
            db.commit()
            raise AuthenticationError("Session expired")

        from app.core.auth import _utc_now
        now = _utc_now()
        session.last_activity_at = now.replace(tzinfo=None) if now.tzinfo else now
        db.commit()

        user = db.get(User, int(user_id))
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")

        token_data_dict = {"sub": str(user.id), "session_id": session_id}
        access_token = create_access_token(data=token_data_dict)
        refresh_token_value = create_refresh_token(data=token_data_dict)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "idle_timeout_seconds": settings.SESSION_IDLE_TIMEOUT_MINUTES * 60,
            "absolute_timeout_seconds": settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES * 60,
        }
    except AuthenticationError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )


@router.post("/logout")
def logout(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """User logout endpoint; destroys server-side session. Accepts token even if expired so client can clear state."""
    if token:
        try:
            payload = verify_token(token)
            session_id = payload.get("session_id")
            if session_id:
                db.execute(delete(Session).where(Session.id == session_id))
                db.commit()
        except Exception:
            pass  # Still return success so client clears tokens
    return {"message": "Successfully logged out"}


@router.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information and session timeout hints for client-side warning."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "score": current_user.score,
        "rank": current_user.rank,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "must_change_password": current_user.must_change_password if hasattr(current_user, 'must_change_password') else False,
        "idle_timeout_seconds": settings.SESSION_IDLE_TIMEOUT_MINUTES * 60,
        "absolute_timeout_seconds": settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES * 60,
    }


@router.post("/session/extend")
def session_extend(
    current_user: User = Depends(get_current_user),
):
    """Extend session (reset idle timer). Any authenticated request does this; explicit endpoint for 'Stay logged in' button."""
    return {"message": "Session extended"}


@router.post("/password-reset")
def request_password_reset(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    # Implementation would send email with reset token
    return {"message": "Password reset email sent"}


@router.post("/password-reset/confirm")
def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Confirm password reset"""
    # Implementation would verify token and update password
    return {"message": "Password reset successfully"}


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class UpdateProfile(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None


@router.put("/me")
def update_profile(
    profile_data: UpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        if profile_data.full_name is not None:
            current_user.full_name = profile_data.full_name
        
        if profile_data.email is not None:
            # Check if email is already taken
            existing_user = db.execute(
                select(User).where(
                    User.email == profile_data.email,
                    User.id != current_user.id
                )
            ).scalar_one_or_none()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            
            current_user.email = profile_data.email
        
        db.commit()
        db.refresh(current_user)
        
        # Return updated user info in same format as /me endpoint
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value,
            "score": current_user.score,
            "rank": current_user.rank,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "must_change_password": current_user.must_change_password if hasattr(current_user, 'must_change_password') else False
        }
        
    except ValidationError:
        raise
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Database session error: {str(e)}")  # Debug
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/change-password")
def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        from app.core.auth import verify_password, get_password_hash
        
        # Verify current password
        if not verify_password(password_data.current_password, current_user.password_hash):
            raise ValidationError("Current password is incorrect")
        
        # Validate new password
        if len(password_data.new_password) < 8:
            raise ValidationError("New password must be at least 8 characters long")
        
        # Update password
        current_user.password_hash = get_password_hash(password_data.new_password)
        current_user.must_change_password = False  # Clear the flag after password change
        
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Password changed successfully"}
        
    except ValidationError:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )
