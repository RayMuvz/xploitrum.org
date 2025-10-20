"""
XploitRUM CTF Platform - Instance Model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class InstanceStatus(str, enum.Enum):
    """Instance status enumeration"""
    STARTING = "starting"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"
    EXPIRED = "expired"


class Instance(Base):
    """Instance model for deployed challenge containers"""
    
    __tablename__ = "instances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)
    
    # Docker information
    container_id = Column(String(255), unique=True, nullable=True, index=True)
    container_name = Column(String(255), nullable=True)
    container_ip = Column(String(45), nullable=True)  # IPv4/IPv6
    container_ports = Column(JSON, nullable=True)  # Port mappings
    
    # Instance configuration
    status = Column(Enum(InstanceStatus), default=InstanceStatus.STARTING, nullable=False)
    instance_url = Column(String(500), nullable=True)  # Access URL
    vpn_required = Column(Boolean, default=False, nullable=False)
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    stopped_at = Column(DateTime(timezone=True), nullable=True)
    
    # Resource usage
    cpu_usage = Column(Integer, default=0, nullable=False)  # Percentage
    memory_usage = Column(Integer, default=0, nullable=False)  # MB
    network_traffic = Column(Integer, default=0, nullable=False)  # Bytes
    
    # Logs and monitoring
    logs = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    health_check_status = Column(String(50), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    
    # Cleanup
    auto_cleanup = Column(Boolean, default=True, nullable=False)
    cleanup_attempts = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="instances")
    challenge = relationship("Challenge", back_populates="instances")
    
    def __repr__(self):
        return f"<Instance(id={self.id}, user_id={self.user_id}, challenge_id={self.challenge_id}, status='{self.status}')>"
    
    @property
    def is_running(self):
        """Check if instance is running"""
        return self.status == InstanceStatus.RUNNING
    
    @property
    def is_expired(self):
        """Check if instance is expired"""
        from datetime import datetime
        return datetime.utcnow() > self.expires_at
    
    @property
    def time_remaining(self):
        """Get remaining time in seconds"""
        if self.expires_at:
            from datetime import datetime
            remaining = self.expires_at - datetime.utcnow()
            return max(0, int(remaining.total_seconds()))
        return 0
    
    @property
    def duration_minutes(self):
        """Get instance duration in minutes"""
        if self.stopped_at:
            duration = self.stopped_at - self.started_at
        else:
            from datetime import datetime
            duration = datetime.utcnow() - self.started_at
        return int(duration.total_seconds() / 60)
