"""
XploitRUM CTF Platform - Statistics Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.challenge import Challenge, ChallengeStatus
from app.models.user import User, UserStatus
from app.models.event import Event
from app.models.submission import Submission
from app.models.instance import Instance, InstanceStatus

router = APIRouter()

@router.get("/platform")
def get_platform_stats(db: Session = Depends(get_db)):
    """Get real-time platform statistics"""
    
    # Total active challenges
    total_challenges = db.query(Challenge).filter(
        Challenge.status == ChallengeStatus.ACTIVE
    ).count()
    
    # Total active members (users with accounts)
    total_members = db.query(User).filter(
        User.status == UserStatus.ACTIVE
    ).count()
    
    # Total upcoming events
    total_events = db.query(Event).filter(
        Event.start_date >= datetime.utcnow()
    ).count()
    
    # Total flags captured
    total_flags = db.query(Submission).filter(
        Submission.status == "correct"
    ).count()
    
    # Active instances
    active_instances = db.query(Instance).filter(
        Instance.status == InstanceStatus.RUNNING
    ).count()
    
    # Total solves in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_solves = db.query(Submission).filter(
        Submission.status == "correct",
        Submission.submitted_at >= yesterday
    ).count()
    
    # Total users online (users with activity in last 30 minutes)
    thirty_min_ago = datetime.utcnow() - timedelta(minutes=30)
    users_online = db.query(User).filter(
        User.last_login >= thirty_min_ago
    ).count()
    
    return {
        "total_challenges": total_challenges,
        "total_members": total_members,
        "total_events": total_events,
        "total_flags": total_flags,
        "active_instances": active_instances,
        "recent_solves": recent_solves,
        "users_online": users_online,
        "last_updated": datetime.utcnow().isoformat()
    }

@router.get("/challenges")
def get_challenge_stats(db: Session = Depends(get_db)):
    """Get challenge statistics by category and difficulty"""
    
    # Challenges by category
    category_stats = db.query(
        Challenge.category,
        func.count(Challenge.id).label('count')
    ).filter(
        Challenge.status == ChallengeStatus.ACTIVE
    ).group_by(Challenge.category).all()
    
    # Challenges by difficulty
    difficulty_stats = db.query(
        Challenge.difficulty,
        func.count(Challenge.id).label('count')
    ).filter(
        Challenge.status == ChallengeStatus.ACTIVE
    ).group_by(Challenge.difficulty).all()
    
    # Total solves per challenge
    popular_challenges = db.query(
        Challenge.title,
        Challenge.total_solves
    ).filter(
        Challenge.status == ChallengeStatus.ACTIVE
    ).order_by(Challenge.total_solves.desc()).limit(5).all()
    
    return {
        "by_category": {cat.value: count for cat, count in category_stats},
        "by_difficulty": {diff.value: count for diff, count in difficulty_stats},
        "popular_challenges": [
            {"title": title, "solves": solves} 
            for title, solves in popular_challenges
        ]
    }

@router.get("/events")
def get_event_stats(db: Session = Depends(get_db)):
    """Get event statistics"""
    
    # Upcoming events
    upcoming_events = db.query(Event).filter(
        Event.start_date >= datetime.utcnow()
    ).count()
    
    # Past events
    past_events = db.query(Event).filter(
        Event.start_date < datetime.utcnow()
    ).count()
    
    # Total registrations across all events
    from app.models.event import EventRegistration
    total_registrations = db.query(EventRegistration).count()
    
    return {
        "upcoming_events": upcoming_events,
        "past_events": past_events,
        "total_registrations": total_registrations
    }

@router.get("/leaderboard")
def get_leaderboard_stats(db: Session = Depends(get_db)):
    """Get leaderboard statistics"""
    
    # Top 10 users
    top_users = db.query(
        User.username,
        User.score,
        User.total_solves
    ).filter(
        User.status == UserStatus.ACTIVE,
        User.score > 0
    ).order_by(User.score.desc()).limit(10).all()
    
    # Average score
    avg_score = db.query(func.avg(User.score)).filter(
        User.status == UserStatus.ACTIVE,
        User.score > 0
    ).scalar() or 0
    
    return {
        "top_users": [
            {"username": username, "score": score, "solves": solves}
            for username, score, solves in top_users
        ],
        "average_score": round(avg_score, 2)
    }

