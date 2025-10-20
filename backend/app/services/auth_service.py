"""
XploitRUM CTF Platform - Authentication Service
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.models.user import User, UserRole, UserStatus
from app.core.database import get_db

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token scheme
security = HTTPBearer()

class AuthService:
    """Authentication service for user management"""
    
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.access_token_expire_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def authenticate_user(self, db: Session, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        user = db.query(User).filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return None
        
        if not self.verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            return None
        
        if user.is_locked:
            return None
        
        return user
    
    def register_user(self, db: Session, user_data: Dict[str, Any]) -> User:
        """Register a new user"""
        # Check if username or email already exists
        existing_user = db.query(User).filter(
            (User.username == user_data["username"]) | (User.email == user_data["email"])
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered"
            )
        
        # Create new user
        hashed_password = self.get_password_hash(user_data["password"])
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=hashed_password,
            full_name=user_data.get("full_name"),
            bio=user_data.get("bio"),
            country=user_data.get("country"),
            university=user_data.get("university"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    def update_user_profile(self, db: Session, user_id: int, profile_data: Dict[str, Any]) -> User:
        """Update user profile"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update allowed fields
        allowed_fields = [
            "full_name", "bio", "avatar_url", "country", "university",
            "github_username", "linkedin_url", "website_url"
        ]
        
        for field in allowed_fields:
            if field in profile_data:
                setattr(user, field, profile_data[field])
        
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        return user
    
    def change_password(self, db: Session, user_id: int, old_password: str, new_password: str) -> bool:
        """Change user password"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not self.verify_password(old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password"
            )
        
        user.password_hash = self.get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return True
    
    def reset_password(self, db: Session, email: str) -> bool:
        """Initiate password reset process"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if email exists or not
            return True
        
        # Generate reset token
        reset_data = {
            "user_id": user.id,
            "email": user.email,
            "action": "password_reset"
        }
        reset_token = jwt.encode(
            reset_data, 
            self.secret_key, 
            algorithm=self.algorithm
        )
        
        # Store reset token
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        # TODO: Send email with reset link
        return True
    
    def confirm_password_reset(self, db: Session, reset_token: str, new_password: str) -> bool:
        """Confirm password reset with token"""
        try:
            payload = jwt.decode(reset_token, self.secret_key, algorithms=[self.algorithm])
            user_id = payload.get("user_id")
            
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.password_reset_token != reset_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid reset token"
                )
            
            if user.password_reset_expires < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reset token expired"
                )
            
            user.password_hash = self.get_password_hash(new_password)
            user.password_reset_token = None
            user.password_reset_expires = None
            user.updated_at = datetime.utcnow()
            db.commit()
            
            return True
            
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )


# Create auth service instance
auth_service = AuthService()


# Dependency functions
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = auth_service.verify_token(token, "access")
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user (optional - returns None if not authenticated)"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = auth_service.verify_token(token, "access")
        user_id = payload.get("sub")
        
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except HTTPException:
        return None
