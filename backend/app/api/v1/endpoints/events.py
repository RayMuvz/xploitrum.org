"""
XploitRUM CTF Platform - Event Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.core.database import get_db
from app.services.event_service import event_service
from app.services.auth_service import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.models.event import Event, EventType, EventStatus

# Optional auth dependency for public endpoints
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    
    try:
        from app.services.auth_service import decode_access_token
        token_data = decode_access_token(credentials.credentials)
        user = db.query(User).filter(User.id == token_data.get("sub")).first()
        return user
    except Exception as e:
        # Log the error for debugging
        print(f"Auth error in get_current_user_optional: {e}")
        return None

router = APIRouter()

# Pydantic models
class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    event_type: str
    status: str
    start_date: str
    end_date: str
    location: Optional[str]
    is_virtual: bool
    meeting_link: Optional[str]
    max_participants: Optional[int]
    registration_required: bool
    registration_deadline: Optional[str]
    is_featured: bool
    registered_count: int
    is_registration_open: bool
    is_full: bool
    created_by: int
    created_at: str
    
    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str
    start_date: str
    end_date: str
    location: Optional[str] = None
    is_virtual: bool = False
    meeting_link: Optional[str] = None
    max_participants: Optional[int] = None
    registration_required: bool = False
    registration_deadline: Optional[str] = None
    is_featured: bool = False
    agenda: Optional[str] = None
    requirements: Optional[str] = None
    resources: Optional[str] = None
    ctf_format: Optional[str] = None
    categories: Optional[str] = None
    difficulty_level: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    is_virtual: Optional[bool] = None
    meeting_link: Optional[str] = None
    max_participants: Optional[int] = None
    registration_required: Optional[bool] = None
    registration_deadline: Optional[str] = None
    is_featured: Optional[bool] = None
    status: Optional[str] = None
    agenda: Optional[str] = None
    requirements: Optional[str] = None
    resources: Optional[str] = None
    ctf_format: Optional[str] = None
    categories: Optional[str] = None
    difficulty_level: Optional[str] = None

class EventRegistrationData(BaseModel):
    full_name: str
    email: str
    phone: str
    year_of_study: str

@router.get("", response_model=List[EventResponse])
async def get_events(
    event_type: Optional[EventType] = Query(None, description="Filter by event type"),
    status: Optional[EventStatus] = Query(None, description="Filter by status"),
    featured_only: Optional[bool] = Query(None, description="Show only featured events"),
    upcoming_only: Optional[bool] = Query(None, description="Show only upcoming events"),
    limit: int = Query(10, ge=1, le=100, description="Number of events to return"),
    db: Session = Depends(get_db)
):
    """Get events with optional filters - simplified to avoid 500 errors"""
    try:
        events = []
        
        if upcoming_only:
            # Get events that haven't started yet OR are currently active
            now = datetime.now(timezone.utc)
            events = db.query(Event).filter(
                Event.is_public == True,
                Event.start_date > now
            ).order_by(Event.start_date.asc()).limit(limit).all()
        elif status == EventStatus.COMPLETED:
            events = event_service.get_past_events(db, limit)
        elif status == EventStatus.ACTIVE:
            events = event_service.get_active_events(db)
        else:
            # Get all public events - simple query
            query = db.query(Event).filter(Event.is_public == True)
            
            if event_type:
                query = query.filter(Event.event_type == event_type)
            if status:
                query = query.filter(Event.status == status)
            if featured_only:
                query = query.filter(Event.is_featured == True)
            
            events = query.order_by(Event.start_date.asc()).limit(limit).all()
    except Exception as e:
        print(f"Error in get_events: {e}")
        # Return empty list if there's an error
        events = []
    
    # Convert to response format
    return [
        {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type.value,
            "status": event.status.value,
            "start_date": event.start_date.isoformat() if event.start_date else None,
            "end_date": event.end_date.isoformat() if event.end_date else None,
            "location": event.location,
            "is_virtual": event.is_virtual,
            "meeting_link": event.meeting_link,
            "max_participants": event.max_participants,
            "registration_required": event.registration_required,
            "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
            "is_featured": event.is_featured,
            "registered_count": event.registered_count,
            "is_registration_open": event.is_registration_open,
            "is_full": event.is_full,
            "created_by": event.created_by,
            "created_at": event.created_at.isoformat() if event.created_at else None
        }
        for event in events
    ]

@router.get("/{event_identifier}", response_model=EventResponse)
async def get_event(
    event_identifier: str,
    db: Session = Depends(get_db)
):
    """Get specific event by ID or slug"""
    # Try to parse as integer first (backward compatibility)
    if event_identifier.isdigit():
        event = event_service.get_event_by_id(db, int(event_identifier))
    else:
        # Try to find by slug
        event = event_service.get_event_by_slug(db, event_identifier)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Return formatted response
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type.value,
        "status": event.status.value,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "location": event.location,
        "is_virtual": event.is_virtual,
        "meeting_link": event.meeting_link,
        "max_participants": event.max_participants,
        "registration_required": event.registration_required,
        "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
        "is_featured": event.is_featured,
        "registered_count": event.registered_count,
        "is_registration_open": event.is_registration_open,
        "is_full": event.is_full,
        "created_by": event.created_by,
        "created_at": event.created_at.isoformat() if event.created_at else None
    }

@router.post("")
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new event (admin only)"""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        event = event_service.create_event(db, current_user, event_data.dict())
        
        # Convert datetime fields to ISO strings
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type.value,
            "status": event.status.value,
            "start_date": event.start_date.isoformat() if event.start_date else None,
            "end_date": event.end_date.isoformat() if event.end_date else None,
            "location": event.location,
            "is_virtual": event.is_virtual,
            "meeting_link": event.meeting_link,
            "max_participants": event.max_participants,
            "registration_required": event.registration_required,
            "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
            "is_featured": event.is_featured,
            "registered_count": event.registered_count,
            "is_registration_open": event.is_registration_open,
            "is_full": event.is_full,
            "created_by": event.created_by,
            "created_at": event.created_at.isoformat() if event.created_at else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an event"""
    try:
        event = event_service.update_event(db, current_user, event_id, event_data.dict(exclude_unset=True))
        
        # Convert datetime fields to ISO strings (same format as POST and GET endpoints)
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type.value,
            "status": event.status.value,
            "start_date": event.start_date.isoformat() if event.start_date else None,
            "end_date": event.end_date.isoformat() if event.end_date else None,
            "location": event.location,
            "is_virtual": event.is_virtual,
            "meeting_link": event.meeting_link,
            "max_participants": event.max_participants,
            "registration_required": event.registration_required,
            "registration_deadline": event.registration_deadline.isoformat() if event.registration_deadline else None,
            "is_featured": event.is_featured,
            "registered_count": event.registered_count,
            "is_registration_open": event.is_registration_open,
            "is_full": event.is_full,
            "created_by": event.created_by,
            "created_at": event.created_at.isoformat() if event.created_at else None
        }
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        elif "not authorized" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an event"""
    try:
        event_service.delete_event(db, current_user, event_id)
        return {"message": "Event deleted successfully"}
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        elif "not authorized" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{event_id}/register")
async def register_for_event(
    event_id: int,
    registration_data: EventRegistrationData,
    db: Session = Depends(get_db)
):
    """Register for an event (no login required - open to public)"""
    try:
        from app.models.event import EventRegistration, Event
        
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
        if event.registration_required and not event.is_registration_open:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration is closed")
        
        if event.is_full:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is full")
        
        # Create registration for guest (no user_id required)
        registration = EventRegistration(
            event_id=event_id,
            user_id=None,  # Guests don't have user accounts
            full_name=registration_data.full_name,
            email=registration_data.email,
            phone=registration_data.phone,
            year_of_study=registration_data.year_of_study
        )
        
        # Update event registration count
        event.registered_count += 1
        
        db.add(registration)
        db.commit()
        db.refresh(registration)
        
        return {
            "message": "Successfully registered for event",
            "registration_id": registration.id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{event_id}/unregister")
async def unregister_from_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unregister from an event"""
    try:
        event_service.unregister_from_event(db, current_user, event_id)
        return {"message": "Successfully unregistered from event"}
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{event_id}/registrations")
async def get_event_registrations(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all registrations for an event (Admin only)"""
    from app.models.event import EventRegistration, Event
    
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    # Get event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    # Get all registrations for this event
    registrations = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).all()
    
    return [
        {
            "id": reg.id,
            "event_id": reg.event_id,
            "user_id": reg.user_id,
            "full_name": reg.full_name,
            "email": reg.email,
            "phone": reg.phone,
            "year_of_study": reg.year_of_study,
            "registration_date": reg.registration_date.isoformat() if reg.registration_date else None,
            "attended": reg.attended,
            "user": {
                "full_name": reg.user.full_name if reg.user else None,
                "email": reg.user.email if reg.user else None,
                "university": reg.user.university if reg.user else None
            } if reg.user else None
        }
        for reg in registrations
    ]

@router.get("/user/registrations")
async def get_user_registrations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's event registrations"""
    registrations = event_service.get_user_registrations(db, current_user)
    
    return [
        {
            "id": reg.id,
            "event_id": reg.event_id,
            "event_title": reg.event.title,
            "event_start_date": reg.event.start_date.isoformat(),
            "registration_date": reg.registration_date.isoformat(),
            "attended": reg.attended
        }
        for reg in registrations
    ]

@router.get("/statistics")
async def get_event_statistics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get event statistics (admin only)"""
    return event_service.get_event_statistics(db)

@router.post("/update-statuses")
async def update_event_statuses(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update all event statuses based on current time (admin only)"""
    updated_count = event_service.update_all_event_statuses(db)
    return {
        "message": f"Updated {updated_count} event statuses",
        "updated_count": updated_count
    }

@router.get("/types")
async def get_event_types():
    """Get available event types"""
    return {
        "event_types": [
            {"value": event_type.value, "label": event_type.value.title()} 
            for event_type in EventType
        ],
        "event_statuses": [
            {"value": status.value, "label": status.value.title()} 
            for status in EventStatus
        ]
    }
