"""
XploitRUM CTF Platform - Authentication Utilities
"""

from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.core.exceptions import AuthenticationError

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Convert datetime to Unix timestamp for JWT
    to_encode.update({
        "exp": int(expire.timestamp()),
        "type": "access",
        "iat": int(datetime.utcnow().timestamp())
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Convert datetime to Unix timestamp for JWT
    to_encode.update({
        "exp": int(expire.timestamp()),
        "type": "refresh",
        "iat": int(datetime.utcnow().timestamp())
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        # JWT library handles expiration check automatically
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except JWTError as e:
        raise AuthenticationError("Invalid token")


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    try:
        print(f"[AUTH] Authenticating user: {username}")  # Debug
        
        # Query user by username or email
        stmt = select(User).where(
            (User.username == username) | (User.email == username)
        )
        result = db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"[AUTH] User not found: {username}")  # Debug
            return None
        
        print(f"[AUTH] User found: {user.username}, checking password...")  # Debug
        
        password_valid = verify_password(password, user.password_hash)
        print(f"[AUTH] Password valid: {password_valid}")  # Debug
        
        if not password_valid:
            print(f"[AUTH] Password verification failed for: {username}")  # Debug
            # Increment failed login attempts
            user.failed_login_attempts += 1
            
            # Lock account if too many failed attempts
            if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            
            db.commit()
            return None
        
        print(f"[AUTH] Password verified successfully for: {username}")  # Debug
        
        # Reset failed login attempts on successful login
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.locked_until = None
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        print(f"[AUTH] User authenticated successfully: {username}")  # Debug
        return user
        
    except Exception as e:
        print(f"[AUTH] Exception during authentication: {e}")  # Debug
        import traceback
        traceback.print_exc()
        db.rollback()
        raise AuthenticationError("Authentication failed")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    try:
        print(f"[GET_CURRENT_USER] Verifying token...")  # Debug
        payload = verify_token(token)
        
        user_id = payload.get("sub")
        if user_id is None:
            print(f"[GET_CURRENT_USER] No user_id in token payload")  # Debug
            raise AuthenticationError("Invalid token")
        
        print(f"[GET_CURRENT_USER] Getting user with ID: {user_id}")  # Debug
        
        # Get user from database
        user = db.get(User, int(user_id))
        if user is None:
            print(f"[GET_CURRENT_USER] User not found in database")  # Debug
            raise AuthenticationError("User not found")
        
        print(f"[GET_CURRENT_USER] User found: {user.username}, Active: {user.is_active}")  # Debug
        
        if not user.is_active:
            raise AuthenticationError("User account is inactive")
        
        return user
        
    except AuthenticationError as e:
        print(f"[GET_CURRENT_USER] AuthenticationError: {e}")  # Debug
        raise
    except Exception as e:
        print(f"[GET_CURRENT_USER] Exception: {e}")  # Debug
        import traceback
        traceback.print_exc()
        raise AuthenticationError("Authentication failed")


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise AuthenticationError("User account is inactive")
    
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current admin user"""
    if not current_user.is_admin:
        raise AuthenticationError("Admin access required")
    
    return current_user


def require_role(required_role: str):
    """Decorator to require specific user role"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value != required_role:
            raise AuthenticationError(f"Role '{required_role}' required")
        return current_user
    
    return role_checker
