"""
XploitRUM CTF Platform - Member Request Model
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, Enum
from sqlalchemy.orm import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class MemberRequestStatus(str, enum.Enum):
    """Status of a member request"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class MemberRequest(Base):
    """Model for member account requests"""
    
    __tablename__ = "member_requests"
    
    id = Column(String, primary_key=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(50), nullable=True)
    student_number = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=True)  # hashed password from form; used when request is accepted
    status = Column(Enum(MemberRequestStatus), default=MemberRequestStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

