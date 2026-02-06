"""
XploitRUM CTF Platform - User Model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles enumeration"""
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class UserStatus(str, enum.Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    BANNED = "banned"


class User(Base):
    """User model for authentication and profile management"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Role and status
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    
    # Profile information
    country = Column(String(100), nullable=True)
    university = Column(String(255), nullable=True)
    github_username = Column(String(100), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    
    # CTF specific
    score = Column(Integer, default=0, nullable=False)
    rank = Column(Integer, nullable=True)
    total_solves = Column(Integer, default=0, nullable=False)
    total_attempts = Column(Integer, default=0, nullable=False)
    
    # VPN
    vpn_profile_created = Column(Boolean, default=False, nullable=False)
    vpn_profile_path = Column(String(500), nullable=True)
    vpn_last_connected = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Security
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    must_change_password = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    instances = relationship("Instance", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    pico_submissions = relationship("PicoSubmission", back_populates="user", cascade="all, delete-orphan")
    created_events = relationship("Event", back_populates="creator", cascade="all, delete-orphan")
    event_registrations = relationship("EventRegistration", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
    
    @property
    def is_active(self):
        """Check if user is active"""
        return self.status == UserStatus.ACTIVE
    
    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.role == UserRole.ADMIN
    
    @property
    def is_locked(self):
        """Check if user account is locked"""
        if self.locked_until:
            from datetime import datetime
            return datetime.utcnow() < self.locked_until
        return False
