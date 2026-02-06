"""
XploitRUM CTF Platform - User Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import get_current_user, get_current_admin_user
from app.models.user import User, UserRole, UserStatus
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = None
    university: Optional[str] = None
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    score: int
    rank: Optional[int] = None
    total_solves: int
    total_attempts: int
    created_at: str
    last_login: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    university: Optional[str] = None
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    score: int
    total_solves: int
    country: Optional[str] = None


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        country=current_user.country,
        university=current_user.university,
        github_username=current_user.github_username,
        linkedin_url=current_user.linkedin_url,
        website_url=current_user.website_url,
        score=current_user.score,
        rank=current_user.rank,
        total_solves=current_user.total_solves,
        total_attempts=current_user.total_attempts,
        created_at=current_user.created_at.isoformat(),
        last_login=current_user.last_login.isoformat() if current_user.last_login else None
    )


@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    try:
        # Update user fields
        for field, value in user_update.dict(exclude_unset=True).items():
            setattr(current_user, field, value)
        
        await db.commit()
        await db.refresh(current_user)
        
        return UserProfile(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            full_name=current_user.full_name,
            bio=current_user.bio,
            avatar_url=current_user.avatar_url,
            country=current_user.country,
            university=current_user.university,
            github_username=current_user.github_username,
            linkedin_url=current_user.linkedin_url,
            website_url=current_user.website_url,
            score=current_user.score,
            rank=current_user.rank,
            total_solves=current_user.total_solves,
            total_attempts=current_user.total_attempts,
            created_at=current_user.created_at.isoformat(),
            last_login=current_user.last_login.isoformat() if current_user.last_login else None
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get user leaderboard (excludes admin)."""
    try:
        stmt = select(User).where(
            User.status == UserStatus.ACTIVE,
            User.role != UserRole.ADMIN
        ).order_by(
            User.score.desc(),
            User.total_solves.desc(),
            User.created_at.asc()
        ).offset(offset).limit(limit)
        
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        leaderboard = []
        for i, user in enumerate(users):
            leaderboard.append(LeaderboardEntry(
                rank=offset + i + 1,
                username=user.username,
                score=user.score,
                total_solves=user.total_solves,
                country=user.country
            ))
        
        return leaderboard
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get leaderboard"
        )


@router.get("/{user_id}", response_model=UserProfile)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user by ID (public profile)"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise NotFoundError("User not found")
        
        return UserProfile(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            country=user.country,
            university=user.university,
            github_username=user.github_username,
            linkedin_url=user.linkedin_url,
            website_url=user.website_url,
            score=user.score,
            rank=user.rank,
            total_solves=user.total_solves,
            total_attempts=user.total_attempts,
            created_at=user.created_at.isoformat(),
            last_login=user.last_login.isoformat() if user.last_login else None
        )
        
    except NotFoundError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user"
        )


# Admin endpoints
@router.post("/", response_model=UserProfile)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create new user (admin only)"""
    try:
        # Check if user already exists
        stmt = select(User).where(
            (User.username == user_data.username) | (User.email == user_data.email)
        )
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValidationError("Username or email already exists")
        
        # Create new user
        from app.core.auth import get_password_hash
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            role=user_data.role
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return UserProfile(
            id=new_user.id,
            username=new_user.username,
            email=new_user.email,
            full_name=new_user.full_name,
            bio=new_user.bio,
            avatar_url=new_user.avatar_url,
            country=new_user.country,
            university=new_user.university,
            github_username=new_user.github_username,
            linkedin_url=new_user.linkedin_url,
            website_url=new_user.website_url,
            score=new_user.score,
            rank=new_user.rank,
            total_solves=new_user.total_solves,
            total_attempts=new_user.total_attempts,
            created_at=new_user.created_at.isoformat(),
            last_login=new_user.last_login.isoformat() if new_user.last_login else None
        )
        
    except ValidationError:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
