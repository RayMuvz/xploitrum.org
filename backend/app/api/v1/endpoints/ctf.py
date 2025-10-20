"""
XploitRUM CTF Platform - CTF Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.services.ctf_service import ctf_service
from app.services.auth_service import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.challenge import Challenge, ChallengeCategory, ChallengeDifficulty
from app.models.submission import Submission
from app.models.instance import Instance, InstanceStatus

router = APIRouter()

# Pydantic models
class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    points: int
    total_solves: int
    total_attempts: int
    solve_percentage: float
    is_solved: bool = False
    has_active_instance: bool = False
    author: str
    created_at: str
    
    class Config:
        from_attributes = True

class InstanceResponse(BaseModel):
    id: int
    challenge_id: int
    challenge_title: str
    challenge_category: str
    status: str
    started_at: Optional[str]
    expires_at: Optional[str] = None
    container_name: str
    ports: Optional[dict] = None
    ip_address: Optional[str] = None
    instance_url: Optional[str] = None
    time_remaining: Optional[int] = None
    status_details: Optional[str] = None

class FlagSubmission(BaseModel):
    challenge_id: int
    flag: str

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    full_name: Optional[str]
    score: int
    total_solves: int
    university: Optional[str]
    country: Optional[str]
    avatar_url: Optional[str]

@router.get("/challenges", response_model=List[ChallengeResponse])
async def get_challenges(
    category: Optional[ChallengeCategory] = Query(None, description="Filter by category"),
    difficulty: Optional[ChallengeDifficulty] = Query(None, description="Filter by difficulty"),
    solved_only: Optional[bool] = Query(None, description="Show only solved challenges"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all available challenges"""
    challenges = ctf_service.get_available_challenges(db, current_user)
    
    # Apply filters
    if category:
        challenges = [c for c in challenges if c.category == category]
    
    if difficulty:
        challenges = [c for c in challenges if c.difficulty == difficulty]
    
    if solved_only is not None:
        if solved_only:
            challenges = [c for c in challenges if getattr(c, 'is_solved', False)]
        else:
            challenges = [c for c in challenges if not getattr(c, 'is_solved', False)]
    
    return challenges

@router.get("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific challenge details"""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )
    
    # Add solve status
    existing_submission = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.challenge_id == challenge_id,
        Submission.status == "correct"
    ).first()
    challenge.is_solved = existing_submission is not None
    
    return challenge

@router.post("/challenges/{challenge_id}/deploy")
async def deploy_challenge(
    challenge_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Deploy a challenge instance (public access for active challenges)"""
    print(f"DEBUG: Deploy request for challenge {challenge_id}")
    print(f"DEBUG: Current user: {current_user}")
    
    # Check if challenge exists and is active
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        print(f"DEBUG: Challenge {challenge_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )
    
    print(f"DEBUG: Challenge found: {challenge.title}, status: {challenge.status}")
    
    # Convert status to string for comparison
    if hasattr(challenge.status, 'value'):
        status_str = challenge.status.value
    else:
        status_str = str(challenge.status)
    print(f"DEBUG: Status string: {status_str}")
    
    # Only allow deployment if challenge is active
    if status_str not in ["active", "ACTIVE"]:
        print(f"DEBUG: Challenge status '{status_str}' is not active")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Challenge is not active"
        )
    
    # For non-logged-in users, create a temporary user context
    if not current_user:
        # Create a temporary user object for the service
        class TempUser:
            def __init__(self):
                self.id = None  # Use NULL for anonymous users
                self.username = "anonymous"
                self.email = None
        
        current_user = TempUser()
    
    return ctf_service.deploy_challenge_instance(db, current_user, challenge_id)

@router.post("/challenges/{challenge_id}/stop")
async def stop_challenge_instance(
    challenge_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Stop a challenge instance"""
    # Find the active instance for this challenge and user
    instance = db.query(Instance).filter(
        Instance.user_id == current_user.id,
        Instance.challenge_id == challenge_id,
        Instance.status == InstanceStatus.RUNNING
    ).first()
    
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active instance found for this challenge"
        )
    
    return ctf_service.stop_challenge_instance(db, current_user, instance.id)

@router.post("/challenges/{challenge_id}/submit")
async def submit_flag(
    challenge_id: int,
    flag_submission: FlagSubmission,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit a flag for a challenge"""
    return ctf_service.submit_flag(db, current_user, challenge_id, flag_submission.flag)

@router.get("/instances", response_model=List[InstanceResponse])
async def get_user_instances(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's challenge instances"""
    return ctf_service.get_user_instances(db, current_user)

@router.get("/instances/{instance_id}", response_model=InstanceResponse)
async def get_instance(
    instance_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get a specific instance by ID"""
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )
    
    # Get challenge info
    challenge = db.query(Challenge).filter(Challenge.id == instance.challenge_id).first()
    
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )
    
    # Calculate time remaining
    from datetime import datetime
    if instance.expires_at:
        time_remaining = max(0, int((instance.expires_at - datetime.utcnow()).total_seconds()))
    else:
        time_remaining = 0
    
    # Return instance details
    return InstanceResponse(
        id=instance.id,
        challenge_id=instance.challenge_id,
        challenge_title=challenge.title,
        challenge_category=challenge.category.value,
        status=instance.status.value,
        started_at=instance.started_at.isoformat() if instance.started_at else None,
        expires_at=instance.expires_at.isoformat() if instance.expires_at else None,
        container_name=instance.container_name or f"challenge-{challenge.id}-{instance.id}",
        ports=instance.container_ports,
        ip_address=instance.container_ip,
        instance_url=instance.instance_url,
        time_remaining=time_remaining
    )

@router.post("/instances/{instance_id}/stop")
async def stop_instance_by_id(
    instance_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Stop a specific instance by ID"""
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )
    
    # Stop the instance
    if current_user:
        return ctf_service.stop_challenge_instance(db, current_user, instance_id)
    else:
        # For anonymous users, just stop the container
        from app.services.docker_service import DockerService
        docker_service = DockerService()
        if instance.container_id and docker_service.is_available:
            await docker_service.stop_container(instance.container_id)
        
        # Update instance status
        instance.status = InstanceStatus.STOPPED
        from datetime import datetime
        instance.stopped_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Instance stopped successfully"}

@router.delete("/instances/{instance_id}")
async def stop_instance(
    instance_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Stop a specific instance"""
    return ctf_service.stop_challenge_instance(db, current_user, instance_id)

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(100, ge=1, le=1000, description="Number of entries to return"),
    db: Session = Depends(get_db)
):
    """Get leaderboard"""
    return ctf_service.get_leaderboard(db, limit)

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    stats = {
        "total_score": current_user.score,
        "total_solves": current_user.total_solves,
        "total_attempts": current_user.total_attempts,
        "rank": current_user.rank,
        "solve_rate": 0,
        "challenges_by_category": {},
        "challenges_by_difficulty": {}
    }
    
    # Calculate solve rate
    if current_user.total_attempts > 0:
        stats["solve_rate"] = round((current_user.total_solves / current_user.total_attempts) * 100, 2)
    
    # Get category breakdown
    category_stats = db.query(
        Challenge.category,
        db.func.count(Submission.id).label('solves')
    ).join(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.status == "correct"
    ).group_by(Challenge.category).all()
    
    stats["challenges_by_category"] = {cat.value: count for cat, count in category_stats}
    
    # Get difficulty breakdown
    difficulty_stats = db.query(
        Challenge.difficulty,
        db.func.count(Submission.id).label('solves')
    ).join(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.status == "correct"
    ).group_by(Challenge.difficulty).all()
    
    stats["challenges_by_difficulty"] = {diff.value: count for diff, count in difficulty_stats}
    
    return stats

@router.get("/categories")
async def get_challenge_categories():
    """Get available challenge categories"""
    return {
        "categories": [
            {"value": cat.value, "label": cat.value.title()} 
            for cat in ChallengeCategory
        ],
        "difficulties": [
            {"value": diff.value, "label": diff.value.title()} 
            for diff in ChallengeDifficulty
        ]
    }
