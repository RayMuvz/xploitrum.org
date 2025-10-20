"""
XploitRUM CTF Platform - Admin Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_admin_user
from app.models.user import User, UserStatus
from app.models.challenge import Challenge, ChallengeStatus
from app.models.instance import Instance, InstanceStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.log import Log, LogLevel, LogEventType
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()


class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_challenges: int
    active_challenges: int
    total_instances: int
    running_instances: int
    total_submissions: int
    correct_submissions: int


class UserManagement(BaseModel):
    id: int
    username: str
    email: str
    role: str
    status: str
    score: int
    created_at: str
    last_login: Optional[str] = None


class SystemLog(BaseModel):
    id: int
    event_type: LogEventType
    level: LogLevel
    message: str
    user_id: Optional[int] = None
    created_at: str


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    try:
        # User statistics
        total_users = await db.execute(select(func.count(User.id)))
        active_users = await db.execute(
            select(func.count(User.id)).where(User.status == UserStatus.ACTIVE)
        )
        
        # Challenge statistics
        total_challenges = await db.execute(select(func.count(Challenge.id)))
        active_challenges = await db.execute(
            select(func.count(Challenge.id)).where(Challenge.status == ChallengeStatus.ACTIVE)
        )
        
        # Instance statistics
        total_instances = await db.execute(select(func.count(Instance.id)))
        running_instances = await db.execute(
            select(func.count(Instance.id)).where(Instance.status == InstanceStatus.RUNNING)
        )
        
        # Submission statistics
        total_submissions = await db.execute(select(func.count(Submission.id)))
        correct_submissions = await db.execute(
            select(func.count(Submission.id)).where(Submission.status == SubmissionStatus.CORRECT)
        )
        
        return DashboardStats(
            total_users=total_users.scalar(),
            active_users=active_users.scalar(),
            total_challenges=total_challenges.scalar(),
            active_challenges=active_challenges.scalar(),
            total_instances=total_instances.scalar(),
            running_instances=running_instances.scalar(),
            total_submissions=total_submissions.scalar(),
            correct_submissions=correct_submissions.scalar()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get dashboard stats"
        )


@router.get("/users", response_model=List[UserManagement])
async def get_all_users(
    limit: int = 100,
    offset: int = 0,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    try:
        query = select(User)
        
        # Apply filters
        filters = []
        if status:
            filters.append(User.status == status)
        if search:
            filters.append(
                (User.username.ilike(f"%{search}%")) |
                (User.email.ilike(f"%{search}%")) |
                (User.full_name.ilike(f"%{search}%"))
            )
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        return [
            UserManagement(
                id=user.id,
                username=user.username,
                email=user.email,
                role=user.role.value,
                status=user.status.value,
                score=user.score,
                created_at=user.created_at.isoformat(),
                last_login=user.last_login.isoformat() if user.last_login else None
            )
            for user in users
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users"
        )


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    status: UserStatus,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user status (admin only)"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise NotFoundError("User not found")
        
        if user.id == current_user.id:
            raise ValidationError("Cannot modify your own status")
        
        user.status = status
        await db.commit()
        
        return {"message": f"User status updated to {status.value}"}
        
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user status"
        )


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise NotFoundError("User not found")
        
        if user.id == current_user.id:
            raise ValidationError("Cannot modify your own role")
        
        from app.models.user import UserRole
        if role not in [r.value for r in UserRole]:
            raise ValidationError("Invalid role")
        
        user.role = UserRole(role)
        await db.commit()
        
        return {"message": f"User role updated to {role}"}
        
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user role"
        )


@router.get("/logs", response_model=List[SystemLog])
async def get_system_logs(
    limit: int = 100,
    offset: int = 0,
    level: Optional[LogLevel] = None,
    event_type: Optional[LogEventType] = None,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get system logs (admin only)"""
    try:
        query = select(Log)
        
        # Apply filters
        filters = []
        if level:
            filters.append(Log.level == level)
        if event_type:
            filters.append(Log.event_type == event_type)
        if user_id:
            filters.append(Log.user_id == user_id)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(Log.created_at.desc()).offset(offset).limit(limit)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        return [
            SystemLog(
                id=log.id,
                event_type=log.event_type,
                level=log.level,
                message=log.message,
                user_id=log.user_id,
                created_at=log.created_at.isoformat()
            )
            for log in logs
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system logs"
        )


@router.post("/instances/cleanup")
async def cleanup_expired_instances(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Cleanup expired instances (admin only)"""
    try:
        from app.services.docker_service import DockerService
        
        # Get expired instances
        expired_instances = await db.execute(
            select(Instance).where(
                and_(
                    Instance.status.in_([InstanceStatus.RUNNING, InstanceStatus.STARTING]),
                    Instance.expires_at < datetime.utcnow()
                )
            )
        )
        instances = expired_instances.scalars().all()
        
        docker_service = DockerService()
        cleaned_count = 0
        
        for instance in instances:
            try:
                # Stop Docker container
                if instance.container_id:
                    await docker_service.stop_container(instance.container_id)
                
                # Update instance status
                instance.status = InstanceStatus.EXPIRED
                instance.stopped_at = datetime.utcnow()
                cleaned_count += 1
                
            except Exception as e:
                # Log error but continue with other instances
                pass
        
        await db.commit()
        
        return {
            "message": f"Cleaned up {cleaned_count} expired instances",
            "cleaned_count": cleaned_count
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup instances"
        )


@router.get("/analytics")
async def get_analytics_data(
    days: int = 30,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get analytics data (admin only)"""
    try:
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # User registrations over time
        registrations = await db.execute(
            select(func.date(User.created_at), func.count(User.id))
            .where(User.created_at >= start_date)
            .group_by(func.date(User.created_at))
        )
        
        # Challenge submissions over time
        submissions = await db.execute(
            select(func.date(Submission.submitted_at), func.count(Submission.id))
            .where(Submission.submitted_at >= start_date)
            .group_by(func.date(Submission.submitted_at))
        )
        
        # Challenge popularity
        challenge_popularity = await db.execute(
            select(Challenge.title, func.count(Submission.id))
            .join(Submission, Challenge.id == Submission.challenge_id)
            .where(Submission.submitted_at >= start_date)
            .group_by(Challenge.id, Challenge.title)
            .order_by(func.count(Submission.id).desc())
            .limit(10)
        )
        
        return {
            "user_registrations": dict(registrations.all()),
            "daily_submissions": dict(submissions.all()),
            "popular_challenges": [
                {"challenge": title, "submissions": count}
                for title, count in challenge_popularity.all()
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analytics data"
        )
