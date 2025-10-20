"""
XploitRUM CTF Platform - Challenge Model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ChallengeCategory(str, enum.Enum):
    """Challenge category enumeration"""
    WEB = "web"
    CRYPTO = "crypto"
    PWN = "pwn"
    REVERSE = "reverse"
    FORENSICS = "forensics"
    OSINT = "osint"
    MISC = "misc"
    MACHINE_LEARNING = "ml"
    MOBILE = "mobile"
    NETWORK = "network"


class ChallengeDifficulty(str, enum.Enum):
    """Challenge difficulty enumeration"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class ChallengeStatus(str, enum.Enum):
    """Challenge status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISABLED = "disabled"
    MAINTENANCE = "maintenance"


class Challenge(Base):
    """Challenge model for CTF challenges"""
    
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(Enum(ChallengeCategory), nullable=False, index=True)
    difficulty = Column(Enum(ChallengeDifficulty), nullable=False, index=True)
    points = Column(Integer, nullable=False, default=100)
    flag = Column(String(500), nullable=False)  # Encrypted flag
    author = Column(String(255), nullable=False)
    
    # Docker configuration
    docker_image = Column(String(255), nullable=True)
    docker_compose_file = Column(Text, nullable=True)
    docker_ports = Column(JSON, nullable=True)  # List of port mappings
    docker_environment = Column(JSON, nullable=True)  # Environment variables
    docker_volumes = Column(JSON, nullable=True)  # Volume mappings
    
    # Challenge configuration
    max_instances = Column(Integer, default=10, nullable=False)
    instance_timeout = Column(Integer, default=3600, nullable=False)  # seconds
    max_solves = Column(Integer, nullable=True)  # None = unlimited
    
    # Files and resources
    attachments = Column(JSON, nullable=True)  # List of file paths
    hints = Column(JSON, nullable=True)  # List of hints with costs
    tags = Column(JSON, nullable=True)  # List of tags
    
    # Statistics
    total_solves = Column(Integer, default=0, nullable=False)
    total_attempts = Column(Integer, default=0, nullable=False)
    solve_percentage = Column(Integer, default=0, nullable=False)
    
    # Status and visibility
    status = Column(Enum(ChallengeStatus), default=ChallengeStatus.DRAFT, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    instances = relationship("Instance", back_populates="challenge", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="challenge", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Challenge(id={self.id}, title='{self.title}', category='{self.category}')>"
    
    @property
    def is_active(self):
        """Check if challenge is active"""
        return self.status == ChallengeStatus.ACTIVE
    
    @property
    def is_available(self):
        """Check if challenge is available for deployment"""
        return self.is_active and self.docker_image is not None
    
    def get_solve_rate(self):
        """Calculate solve rate percentage"""
        if self.total_attempts == 0:
            return 0
        return round((self.total_solves / self.total_attempts) * 100, 2)
