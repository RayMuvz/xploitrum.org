"""
XploitRUM CTF Platform - Authentication Utilities
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import select, delete

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.session import Session
from app.core.exceptions import AuthenticationError

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


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


def _utc_now():
    """Current time in UTC (timezone-aware)."""
    return datetime.now(timezone.utc)


def _naive_utc(dt):
    """Ensure datetime is comparable with UTC: if naive, assume UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def cleanup_expired_sessions(db: DBSession) -> int:
    """Delete sessions that have exceeded idle or absolute timeout. Returns count deleted."""
    now = _utc_now()
    idle_limit = now - timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES)
    absolute_limit = now - timedelta(minutes=settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES)
    # Compare with naive UTC for SQLite (stored without tz)
    idle_naive = idle_limit.replace(tzinfo=None) if idle_limit.tzinfo else idle_limit
    absolute_naive = absolute_limit.replace(tzinfo=None) if absolute_limit.tzinfo else absolute_limit
    result = db.execute(
        delete(Session).where(
            (Session.last_activity_at < idle_naive) | (Session.created_at < absolute_naive)
        )
    )
    count = getattr(result, "rowcount", None) or 0
    db.commit()
    return count


def _session_expired(session: Session) -> bool:
    """True if session has exceeded idle or absolute timeout."""
    now = _utc_now()
    idle_limit = now - timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES)
    absolute_limit = now - timedelta(minutes=settings.SESSION_ABSOLUTE_TIMEOUT_MINUTES)
    last_activity = _naive_utc(session.last_activity_at)
    created = _naive_utc(session.created_at)
    if last_activity is not None and last_activity < idle_limit:
        return True
    if created is not None and created < absolute_limit:
        return True
    return False


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: DBSession = Depends(get_db)
) -> User:
    """Get current authenticated user; validates server-side session (idle + absolute timeout) when session_id present."""
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        if user_id is None:
            raise AuthenticationError("Invalid token")

        # When token has session_id: enforce server-side session (idle + absolute timeout)
        if session_id:
            session = db.get(Session, session_id)
            if session is None:
                raise AuthenticationError("Session invalid or expired")
            if _session_expired(session):
                db.execute(delete(Session).where(Session.id == session_id))
                db.commit()
                raise AuthenticationError("Session expired due to inactivity or max time")

            # Update last activity (extends idle timeout)
            now = _utc_now()
            session.last_activity_at = now.replace(tzinfo=None) if now.tzinfo else now
            db.commit()

        # Load user by sub (works for both session-backed and legacy tokens)
        user = db.get(User, int(user_id))
        if user is None:
            raise AuthenticationError("User not found")
        if not user.is_active:
            raise AuthenticationError("User account is inactive")
        return user

    except AuthenticationError as e:
        raise
    except Exception as e:
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


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: DBSession = Depends(get_db),
) -> Optional[User]:
    """Return current user if valid token present, else None. Does not raise."""
    if not token:
        return None
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        if not user_id:
            return None
        if session_id:
            session = db.get(Session, session_id)
            if session is None or _session_expired(session):
                return None
        user = db.get(User, int(user_id))
        if user is None or not user.is_active:
            return None
        return user
    except Exception:
        return None


def require_role(required_role: str):
    """Decorator to require specific user role"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value != required_role:
            raise AuthenticationError(f"Role '{required_role}' required")
        return current_user
    
    return role_checker
