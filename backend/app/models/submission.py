"""
XploitRUM CTF Platform - Submission Model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class SubmissionStatus(str, enum.Enum):
    """Submission status enumeration"""
    CORRECT = "correct"
    INCORRECT = "incorrect"
    DUPLICATE = "duplicate"
    INVALID = "invalid"


class Submission(Base):
    """Submission model for flag submissions"""
    
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)
    instance_id = Column(Integer, ForeignKey("instances.id"), nullable=True, index=True)
    
    # Submission details
    flag = Column(String(500), nullable=False)  # Submitted flag
    status = Column(Enum(SubmissionStatus), nullable=False, index=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    
    # Timing
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Additional information
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)  # Admin notes
    
    # Relationships
    user = relationship("User", back_populates="submissions")
    challenge = relationship("Challenge", back_populates="submissions")
    instance = relationship("Instance")
    
    def __repr__(self):
        return f"<Submission(id={self.id}, user_id={self.user_id}, challenge_id={self.challenge_id}, status='{self.status}')>"
    
    @property
    def is_correct(self):
        """Check if submission is correct"""
        return self.status == SubmissionStatus.CORRECT
    
    @property
    def is_first_blood(self):
        """Check if this is first blood (first correct submission)"""
        # This would need to be checked against other submissions
        # Implementation would require additional query logic
        return False
