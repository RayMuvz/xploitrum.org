"""
XploitRUM - Machine Model (HTB-style)
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class MachineOS(str, enum.Enum):
    """Machine operating system"""
    LINUX = "Linux"
    WINDOWS = "Windows"
    OTHER = "Other"


class MachineDifficulty(str, enum.Enum):
    """Machine difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    INSANE = "insane"


class MachineStatus(str, enum.Enum):
    """Machine status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    RETIRED = "retired"


class Machine(Base):
    """Machine model for HTB-style vulnerable machines"""
    
    __tablename__ = "machines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    os = Column(Enum(MachineOS), nullable=False, default=MachineOS.LINUX)
    difficulty = Column(Enum(MachineDifficulty), nullable=False, default=MachineDifficulty.EASY)
    points = Column(Integer, nullable=False, default=20)
    
    # Container configuration
    docker_image = Column(String(255), nullable=False)
    base_ip_address = Column(String(45), nullable=False, default="10.10.10.X")
    
    # Flags
    user_flag = Column(String(500), nullable=True)  # Encrypted
    root_flag = Column(String(500), nullable=True)  # Encrypted
    
    # Status
    status = Column(Enum(MachineStatus), nullable=False, default=MachineStatus.ACTIVE)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    # Stats
    total_owns = Column(Integer, default=0, nullable=False)
    user_owns = Column(Integer, default=0, nullable=False)
    root_owns = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    created_by = Column(Integer, nullable=True)
    
    def __repr__(self):
        return f"<Machine(id={self.id}, name='{self.name}', difficulty='{self.difficulty}')>"


class MachineInstance(Base):
    """Running instance of a machine"""
    
    __tablename__ = "machine_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=True)  # None for anonymous
    
    # Container info
    container_id = Column(String(255), nullable=True)
    container_name = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=False)
    
    # Status
    status = Column(String(50), default="running", nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    stopped_at = Column(DateTime(timezone=True), nullable=True)
    
    @property
    def time_remaining(self):
        """Get remaining time in seconds"""
        if self.expires_at:
            from datetime import datetime
            remaining = self.expires_at - datetime.utcnow()
            return max(0, int(remaining.total_seconds()))
        return 0
    
    def __repr__(self):
        return f"<MachineInstance(id={self.id}, machine_id={self.machine_id}, ip={self.ip_address})>"

