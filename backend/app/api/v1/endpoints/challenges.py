"""
XploitRUM CTF Platform - Challenge Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

from app.core.database import get_db
from app.core.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.challenge import Challenge, ChallengeCategory, ChallengeDifficulty, ChallengeStatus
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()


class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    category: ChallengeCategory
    difficulty: ChallengeDifficulty
    points: int
    author: str
    total_solves: int
    total_attempts: int
    solve_percentage: int
    status: ChallengeStatus
    is_featured: bool
    is_premium: bool
    tags: Optional[List[str]] = None
    created_at: str


class ChallengeCreate(BaseModel):
    title: str
    description: str
    category: ChallengeCategory
    difficulty: ChallengeDifficulty
    points: int
    flag: str
    author: str
    docker_image: Optional[str] = None
    docker_compose_file: Optional[str] = None
    docker_ports: Optional[List[dict]] = None
    docker_environment: Optional[dict] = None
    docker_volumes: Optional[List[dict]] = None
    max_instances: int = 10
    instance_timeout: int = 3600
    max_solves: Optional[int] = None
    hints: Optional[List[dict]] = None
    tags: Optional[List[str]] = None
    is_featured: bool = False
    is_premium: bool = False


class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ChallengeCategory] = None
    difficulty: Optional[ChallengeDifficulty] = None
    points: Optional[int] = None
    docker_image: Optional[str] = None
    docker_compose_file: Optional[str] = None
    docker_ports: Optional[List[dict]] = None
    docker_environment: Optional[dict] = None
    docker_volumes: Optional[List[dict]] = None
    max_instances: Optional[int] = None
    instance_timeout: Optional[int] = None
    max_solves: Optional[int] = None
    hints: Optional[List[dict]] = None
    tags: Optional[List[str]] = None
    status: Optional[ChallengeStatus] = None
    is_featured: Optional[bool] = None
    is_premium: Optional[bool] = None


class ChallengeFilter(BaseModel):
    category: Optional[ChallengeCategory] = None
    difficulty: Optional[ChallengeDifficulty] = None
    status: Optional[ChallengeStatus] = None
    is_featured: Optional[bool] = None
    is_premium: Optional[bool] = None
    search: Optional[str] = None


@router.get("/", response_model=List[ChallengeResponse])
def get_challenges(
    category: Optional[ChallengeCategory] = Query(None),
    difficulty: Optional[ChallengeDifficulty] = Query(None),
    challenge_status: Optional[ChallengeStatus] = Query(None, alias="status"),
    featured: Optional[bool] = Query(None),
    premium: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get challenges with filtering"""
    try:
        # Build query
        query = select(Challenge)
        
        # Apply filters
        filters = []
        
        if category:
            filters.append(Challenge.category == category)
        
        if difficulty:
            filters.append(Challenge.difficulty == difficulty)
        
        if challenge_status:
            filters.append(Challenge.status == challenge_status)
        else:
            # Show both ACTIVE and INACTIVE challenges (exclude DRAFT)
            filters.append(Challenge.status.in_([ChallengeStatus.ACTIVE, ChallengeStatus.INACTIVE]))
        
        if featured is not None:
            filters.append(Challenge.is_featured == featured)
        
        if premium is not None:
            filters.append(Challenge.is_premium == premium)
        
        if search:
            filters.append(
                or_(
                    Challenge.title.ilike(f"%{search}%"),
                    Challenge.description.ilike(f"%{search}%"),
                    Challenge.author.ilike(f"%{search}%")
                )
            )
        
        if filters:
            query = query.where(and_(*filters))
        
        # Order by featured, then by points
        query = query.order_by(
            Challenge.is_featured.desc(),
            Challenge.points.desc(),
            Challenge.created_at.desc()
        )
        
        # Apply pagination
        query = query.offset(offset).limit(limit)
        
        result = db.execute(query)
        challenges = result.scalars().all()
        
        return [
            ChallengeResponse(
                id=challenge.id,
                title=challenge.title,
                description=challenge.description,
                category=challenge.category,
                difficulty=challenge.difficulty,
                points=challenge.points,
                author=challenge.author,
                total_solves=challenge.total_solves,
                total_attempts=challenge.total_attempts,
                solve_percentage=challenge.solve_percentage,
                status=challenge.status,
                is_featured=challenge.is_featured,
                is_premium=challenge.is_premium,
                tags=challenge.tags,
                created_at=challenge.created_at.isoformat()
            )
            for challenge in challenges
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get challenges"
        )


@router.get("/{challenge_id}", response_model=ChallengeResponse)
def get_challenge(
    challenge_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get challenge by ID"""
    try:
        challenge = db.get(Challenge, challenge_id)
        if not challenge:
            raise NotFoundError("Challenge not found")
        
        # Check if user can access premium challenges
        if challenge.is_premium and (not current_user or not current_user.is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Premium challenge - access denied"
            )
        
        return ChallengeResponse(
            id=challenge.id,
            title=challenge.title,
            description=challenge.description,
            category=challenge.category,
            difficulty=challenge.difficulty,
            points=challenge.points,
            author=challenge.author,
            total_solves=challenge.total_solves,
            total_attempts=challenge.total_attempts,
            solve_percentage=challenge.solve_percentage,
            status=challenge.status,
            is_featured=challenge.is_featured,
            is_premium=challenge.is_premium,
            tags=challenge.tags,
            created_at=challenge.created_at.isoformat()
        )
        
    except NotFoundError:
        raise
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get challenge"
        )


@router.get("/categories/list")
def get_challenge_categories():
    """Get list of challenge categories"""
    return {
        "categories": [category.value for category in ChallengeCategory],
        "difficulties": [difficulty.value for difficulty in ChallengeDifficulty]
    }


# Admin endpoints
@router.post("/", response_model=ChallengeResponse)
def create_challenge(
    challenge_data: ChallengeCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create new challenge (admin only)"""
    try:
        # Encrypt flag
        from app.core.security import encrypt_flag
        encrypted_flag = encrypt_flag(challenge_data.flag)
        
        new_challenge = Challenge(
            title=challenge_data.title,
            description=challenge_data.description,
            category=challenge_data.category,
            difficulty=challenge_data.difficulty,
            points=challenge_data.points,
            flag=encrypted_flag,
            author=challenge_data.author,
            docker_image=challenge_data.docker_image,
            docker_compose_file=challenge_data.docker_compose_file,
            docker_ports=challenge_data.docker_ports,
            docker_environment=challenge_data.docker_environment,
            docker_volumes=challenge_data.docker_volumes,
            max_instances=challenge_data.max_instances,
            instance_timeout=challenge_data.instance_timeout,
            max_solves=challenge_data.max_solves,
            hints=challenge_data.hints,
            tags=challenge_data.tags,
            is_featured=challenge_data.is_featured,
            is_premium=challenge_data.is_premium,
            status=ChallengeStatus.ACTIVE
        )
        
        db.add(new_challenge)
        db.commit()
        db.refresh(new_challenge)
        
        return ChallengeResponse(
            id=new_challenge.id,
            title=new_challenge.title,
            description=new_challenge.description,
            category=new_challenge.category,
            difficulty=new_challenge.difficulty,
            points=new_challenge.points,
            author=new_challenge.author,
            total_solves=new_challenge.total_solves,
            total_attempts=new_challenge.total_attempts,
            solve_percentage=new_challenge.solve_percentage,
            status=new_challenge.status,
            is_featured=new_challenge.is_featured,
            is_premium=new_challenge.is_premium,
            tags=new_challenge.tags,
            created_at=new_challenge.created_at.isoformat()
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create challenge"
        )


@router.put("/{challenge_id}", response_model=ChallengeResponse)
def update_challenge(
    challenge_id: int,
    challenge_update: ChallengeUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update challenge (admin only)"""
    try:
        challenge = db.get(Challenge, challenge_id)
        if not challenge:
            raise NotFoundError("Challenge not found")
        
        # Update fields
        for field, value in challenge_update.dict(exclude_unset=True).items():
            setattr(challenge, field, value)
        
        db.commit()
        db.refresh(challenge)
        
        return ChallengeResponse(
            id=challenge.id,
            title=challenge.title,
            description=challenge.description,
            category=challenge.category,
            difficulty=challenge.difficulty,
            points=challenge.points,
            author=challenge.author,
            total_solves=challenge.total_solves,
            total_attempts=challenge.total_attempts,
            solve_percentage=challenge.solve_percentage,
            status=challenge.status,
            is_featured=challenge.is_featured,
            is_premium=challenge.is_premium,
            tags=challenge.tags,
            created_at=challenge.created_at.isoformat()
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update challenge"
        )


@router.patch("/{challenge_id}/status")
def update_challenge_status(
    challenge_id: int,
    status_update: dict,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update challenge status (admin only)"""
    try:
        challenge = db.get(Challenge, challenge_id)
        if not challenge:
            raise NotFoundError("Challenge not found")
        
        # Update status
        new_status = status_update.get("status")
        if new_status not in ["ACTIVE", "INACTIVE", "DRAFT"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be ACTIVE, INACTIVE, or DRAFT"
            )
        
        challenge.status = new_status
        db.commit()
        db.refresh(challenge)
        
        return ChallengeResponse(
            id=challenge.id,
            title=challenge.title,
            description=challenge.description,
            category=challenge.category,
            difficulty=challenge.difficulty,
            points=challenge.points,
            author=challenge.author,
            total_solves=challenge.total_solves,
            total_attempts=challenge.total_attempts,
            solve_percentage=challenge.solve_percentage,
            status=challenge.status,
            is_featured=challenge.is_featured,
            is_premium=challenge.is_premium,
            tags=challenge.tags,
            created_at=challenge.created_at.isoformat()
        )
        
    except NotFoundError:
        raise
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update challenge status"
        )


@router.delete("/{challenge_id}")
def delete_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete challenge (admin only)"""
    try:
        challenge = db.get(Challenge, challenge_id)
        if not challenge:
            raise NotFoundError("Challenge not found")
        
        db.delete(challenge)
        db.commit()
        
        return {"message": "Challenge deleted successfully"}
        
    except NotFoundError:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete challenge"
        )
