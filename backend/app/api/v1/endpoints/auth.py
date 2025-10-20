"""
XploitRUM CTF Platform - Authentication Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.auth import authenticate_user, create_access_token, create_refresh_token
from app.core.auth import get_current_user, verify_token
from app.models.user import User
from app.core.exceptions import AuthenticationError, ValidationError

router = APIRouter()


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


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
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token_value = create_refresh_token(data={"sub": str(user.id)})
        
        print(f"Tokens created for user: {user.username}")  # Debug
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": 1800  # 30 minutes in seconds
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
    """Refresh access token"""
    try:
        payload = verify_token(token_data.refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise AuthenticationError("Invalid refresh token")
        
        # Get user
        user = db.get(User, int(user_id))
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        # Create new tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
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
    current_user: User = Depends(get_current_user)
):
    """User logout endpoint"""
    # In a more sophisticated implementation, you might want to blacklist the token
    return {"message": "Successfully logged out"}


@router.get("/me")
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    print(f"[ME] Getting info for user: {current_user.username}")  # Debug
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,  # Convert enum to string
        "score": current_user.score,
        "rank": current_user.rank,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }


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
