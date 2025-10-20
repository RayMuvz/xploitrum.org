"""
XploitRUM CTF Platform - Event Service
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from fastapi import HTTPException, status

from app.models.user import User
from app.models.event import Event, EventStatus, EventType, EventRegistration
from app.services.admin_service import admin_service

class EventService:
    """Event service for managing organization events"""
    
    def get_upcoming_events(self, db: Session, limit: int = 10) -> List[Event]:
        """Get upcoming events"""
        now = datetime.utcnow()
        events = db.query(Event).filter(
            Event.is_public == True,
            Event.start_date > now
        ).order_by(Event.start_date.asc()).limit(limit).all()
        
        # Update status for each event (without committing)
        for event in events:
            event.update_status()
        
        return events
    
    def get_past_events(self, db: Session, limit: int = 10) -> List[Event]:
        """Get past events"""
        now = datetime.utcnow()
        events = db.query(Event).filter(
            Event.is_public == True,
            Event.status == EventStatus.COMPLETED,
            Event.end_date < now
        ).order_by(Event.end_date.desc()).limit(limit).all()
        
        return events
    
    def get_active_events(self, db: Session) -> List[Event]:
        """Get currently active events"""
        now = datetime.utcnow()
        events = db.query(Event).filter(
            Event.is_public == True,
            Event.start_date <= now,
            Event.end_date >= now
        ).order_by(Event.start_date.asc()).all()
        
        # Update status (without committing)
        for event in events:
            event.update_status()
        
        return events
    
    def get_event_by_id(self, db: Session, event_id: int) -> Optional[Event]:
        """Get event by ID"""
        event = db.query(Event).filter(Event.id == event_id).first()
        if event:
            event.update_status()
            db.commit()
        return event
    
    def create_event(self, db: Session, user: User, event_data: Dict[str, Any]) -> Event:
        """Create a new event"""
        # Validate dates
        start_date = datetime.fromisoformat(event_data["start_date"].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(event_data["end_date"].replace('Z', '+00:00'))
        
        if start_date >= end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
        
        if start_date < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date cannot be in the past"
            )
        
        # Create event
        event = Event(
            title=event_data["title"],
            description=event_data["description"],
            event_type=EventType(event_data["event_type"]),
            start_date=start_date,
            end_date=end_date,
            location=event_data.get("location"),
            is_virtual=event_data.get("is_virtual", False),
            meeting_link=event_data.get("meeting_link"),
            max_participants=event_data.get("max_participants"),
            registration_required=event_data.get("registration_required", False),
            registration_deadline=datetime.fromisoformat(event_data["registration_deadline"].replace('Z', '+00:00')) if event_data.get("registration_deadline") else None,
            is_featured=event_data.get("is_featured", False),
            is_public=True,  # Explicitly set events as public by default
            agenda=event_data.get("agenda"),
            requirements=event_data.get("requirements"),
            resources=event_data.get("resources"),
            ctf_format=event_data.get("ctf_format"),
            categories=event_data.get("categories"),
            difficulty_level=event_data.get("difficulty_level"),
            created_by=user.id
        )
        
        # Set initial status
        event.update_status()
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    
    def update_event(self, db: Session, user: User, event_id: int, event_data: Dict[str, Any]) -> Event:
        """Update an existing event"""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check permissions (only creator or admin can update)
        if event.created_by != user.id and user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this event"
            )
        
        # Update fields
        allowed_fields = [
            "title", "description", "event_type", "start_date", "end_date",
            "location", "is_virtual", "meeting_link", "max_participants",
            "registration_required", "registration_deadline", "is_featured",
            "agenda", "requirements", "resources", "ctf_format", "categories",
            "difficulty_level", "status"
        ]
        
        for field in allowed_fields:
            if field in event_data:
                if field in ["start_date", "end_date", "registration_deadline"] and event_data[field]:
                    setattr(event, field, datetime.fromisoformat(event_data[field].replace('Z', '+00:00')))
                elif field == "event_type":
                    setattr(event, field, EventType(event_data[field]))
                elif field == "status":
                    setattr(event, field, EventStatus(event_data[field]))
                else:
                    setattr(event, field, event_data[field])
        
        # Update status based on new dates
        event.update_status()
        
        db.commit()
        db.refresh(event)
        
        return event
    
    def delete_event(self, db: Session, user: User, event_id: int) -> bool:
        """Delete an event"""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check permissions
        if event.created_by != user.id and user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this event"
            )
        
        db.delete(event)
        db.commit()
        
        return True
    
    def register_for_event(self, db: Session, user: User, event_id: int, registration_data: Dict[str, Any] = None) -> EventRegistration:
        """Register user for an event"""
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if registration is required and open
        if event.registration_required and not event.is_registration_open:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration is closed for this event"
            )
        
        # Check if event is full
        if event.is_full:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is at full capacity"
            )
        
        # Check if user is already registered
        existing_registration = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user.id
        ).first()
        
        if existing_registration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already registered for this event"
            )
        
        # Create registration
        registration = EventRegistration(
            event_id=event_id,
            user_id=user.id,
            dietary_restrictions=registration_data.get("dietary_restrictions") if registration_data else None,
            special_requirements=registration_data.get("special_requirements") if registration_data else None
        )
        
        # Update event registration count
        event.registered_count += 1
        
        db.add(registration)
        db.commit()
        db.refresh(registration)
        
        return registration
    
    def unregister_from_event(self, db: Session, user: User, event_id: int) -> bool:
        """Unregister user from an event"""
        registration = db.query(EventRegistration).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user.id
        ).first()
        
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found"
            )
        
        # Update event registration count
        event = db.query(Event).filter(Event.id == event_id).first()
        if event:
            event.registered_count -= 1
        
        db.delete(registration)
        db.commit()
        
        return True
    
    def get_user_registrations(self, db: Session, user: User) -> List[EventRegistration]:
        """Get user's event registrations"""
        return db.query(EventRegistration).filter(
            EventRegistration.user_id == user.id
        ).order_by(desc(EventRegistration.registration_date)).all()
    
    def update_all_event_statuses(self, db: Session) -> int:
        """Update status of all events based on current time"""
        events = db.query(Event).all()
        updated_count = 0
        
        for event in events:
            old_status = event.status
            event.update_status()
            if old_status != event.status:
                updated_count += 1
        
        db.commit()
        return updated_count
    
    def get_event_statistics(self, db: Session) -> Dict[str, Any]:
        """Get event statistics"""
        now = datetime.utcnow()
        
        total_events = db.query(Event).count()
        upcoming_events = db.query(Event).filter(
            Event.start_date > now,
            Event.status.in_([EventStatus.UPCOMING, EventStatus.ACTIVE])
        ).count()
        
        active_events = db.query(Event).filter(
            Event.start_date <= now,
            Event.end_date >= now
        ).count()
        
        past_events = db.query(Event).filter(
            Event.end_date < now,
            Event.status == EventStatus.COMPLETED
        ).count()
        
        total_registrations = db.query(EventRegistration).count()
        
        return {
            "total_events": total_events,
            "upcoming_events": upcoming_events,
            "active_events": active_events,
            "past_events": past_events,
            "total_registrations": total_registrations
        }


# Create event service instance
event_service = EventService()
