"""
XploitRUM CTF Platform - Event Model
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone

from app.core.database import Base


class EventStatus(str, enum.Enum):
    """Event status enumeration"""
    DRAFT = "draft"
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventType(str, enum.Enum):
    """Event type enumeration"""
    CTF = "ctf"
    WORKSHOP = "workshop"
    PRESENTATION = "presentation"
    MEETING = "meeting"
    SOCIAL = "social"
    OTHER = "other"


class Event(Base):
    """Event model for managing organization events"""
    
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    event_type = Column(Enum(EventType), nullable=False, index=True)
    status = Column(Enum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    
    # Event timing
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    registration_deadline = Column(DateTime(timezone=True), nullable=True)
    
    # Location and details
    location = Column(String(255), nullable=True)
    is_virtual = Column(Boolean, default=False, nullable=False)
    meeting_link = Column(String(500), nullable=True)
    
    # Event configuration
    max_participants = Column(Integer, nullable=True)
    registration_required = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    
    # Event content
    agenda = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    resources = Column(Text, nullable=True)  # JSON string for links and materials
    
    # CTF specific fields
    ctf_format = Column(String(100), nullable=True)  # jeopardy, attack-defense, etc.
    categories = Column(String(500), nullable=True)  # comma-separated categories
    difficulty_level = Column(String(50), nullable=True)
    
    # Statistics
    registered_count = Column(Integer, default=0, nullable=False)
    attended_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_events")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Event(id={self.id}, title='{self.title}', start_date='{self.start_date}')>"
    
    @property
    def is_upcoming(self):
        """Check if event is upcoming"""
        now = datetime.now(timezone.utc)
        return now < self.start_date
    
    @property
    def is_active(self):
        """Check if event is currently active"""
        now = datetime.now(timezone.utc)
        return self.start_date <= now <= self.end_date
    
    @property
    def is_past(self):
        """Check if event has ended"""
        now = datetime.now(timezone.utc)
        return now > self.end_date
    
    @property
    def is_registration_open(self):
        """Check if registration is still open"""
        if not self.registration_required or not self.registration_deadline:
            return True
        now = datetime.now(timezone.utc)
        return now < self.registration_deadline
    
    @property
    def is_full(self):
        """Check if event is at capacity"""
        if not self.max_participants:
            return False
        return self.registered_count >= self.max_participants
    
    def update_status(self):
        """Update event status based on current time"""
        now = datetime.now(timezone.utc)
        
        if self.status == EventStatus.CANCELLED:
            return
        
        if self.is_past:
            self.status = EventStatus.COMPLETED
        elif self.is_active:
            self.status = EventStatus.ACTIVE
        elif self.is_upcoming:
            self.status = EventStatus.UPCOMING


class EventRegistration(Base):
    """Event registration model"""
    
    __tablename__ = "event_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for guest registrations
    
    # Guest registration data (for users without accounts)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    university = Column(String(255), nullable=True)
    year_of_study = Column(String(50), nullable=True)
    
    # Registration details
    registration_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    attended = Column(Boolean, default=False, nullable=False)
    attendance_notes = Column(Text, nullable=True)
    
    # Additional information
    dietary_restrictions = Column(String(500), nullable=True)
    special_requirements = Column(Text, nullable=True)
    
    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="event_registrations")
    
    def __repr__(self):
        return f"<EventRegistration(id={self.id}, event_id={self.event_id}, user_id={self.user_id})>"
