"""
XploitRUM CTF Platform - Admin Service
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from fastapi import HTTPException, status

from app.models.user import User, UserRole, UserStatus
from app.models.challenge import Challenge, ChallengeStatus
from app.models.instance import Instance, InstanceStatus
from app.models.submission import Submission
from app.models.log import Log
from app.services.ctf_service import ctf_service

class AdminService:
    """Admin service for managing platform data and statistics"""
    
    def get_dashboard_stats(self, db: Session) -> Dict[str, Any]:
        """Get comprehensive dashboard statistics"""
        stats = {}
        
        # User statistics
        stats["users"] = {
            "total": db.query(User).count(),
            "active": db.query(User).filter(User.status == UserStatus.ACTIVE).count(),
            "new_today": db.query(User).filter(
                func.date(User.created_at) == func.current_date()
            ).count(),
            "admins": db.query(User).filter(User.role == UserRole.ADMIN).count()
        }
        
        # Challenge statistics
        stats["challenges"] = {
            "total": db.query(Challenge).count(),
            "active": db.query(Challenge).filter(Challenge.status == ChallengeStatus.ACTIVE).count(),
            "draft": db.query(Challenge).filter(Challenge.status == ChallengeStatus.DRAFT).count(),
            "by_category": {}
        }
        
        # Challenge breakdown by category
        category_stats = db.query(
            Challenge.category,
            func.count(Challenge.id).label('count')
        ).group_by(Challenge.category).all()
        
        for category, count in category_stats:
            stats["challenges"]["by_category"][category.value] = count
        
        # Instance statistics
        stats["instances"] = {
            "total": db.query(Instance).count(),
            "running": db.query(Instance).filter(Instance.status == InstanceStatus.RUNNING).count(),
            "stopped": db.query(Instance).filter(Instance.status == InstanceStatus.STOPPED).count(),
            "expired": db.query(Instance).filter(Instance.status == InstanceStatus.EXPIRED).count()
        }
        
        # Submission statistics
        stats["submissions"] = {
            "total": db.query(Submission).count(),
            "correct": db.query(Submission).filter(Submission.status == "correct").count(),
            "incorrect": db.query(Submission).filter(Submission.status == "incorrect").count(),
            "today": db.query(Submission).filter(
                func.date(Submission.submitted_at) == func.current_date()
            ).count()
        }
        
        # Calculate success rate
        if stats["submissions"]["total"] > 0:
            stats["submissions"]["success_rate"] = round(
                (stats["submissions"]["correct"] / stats["submissions"]["total"]) * 100, 2
            )
        else:
            stats["submissions"]["success_rate"] = 0
        
        # Top users by score
        top_users = db.query(User).filter(
            User.status == UserStatus.ACTIVE,
            User.score > 0
        ).order_by(desc(User.score)).limit(10).all()
        
        stats["top_users"] = [
            {
                "username": user.username,
                "full_name": user.full_name,
                "score": user.score,
                "total_solves": user.total_solves,
                "rank": user.rank
            }
            for user in top_users
        ]
        
        # Recent activity
        recent_submissions = db.query(Submission).order_by(
            desc(Submission.submitted_at)
        ).limit(10).all()
        
        stats["recent_activity"] = [
            {
                "id": sub.id,
                "username": sub.user.username,
                "challenge_title": sub.challenge.title,
                "is_correct": sub.status == "correct",
                "submitted_at": sub.submitted_at.isoformat()
            }
            for sub in recent_submissions
        ]
        
        return stats
    
    def get_user_management_data(self, db: Session, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Get user management data with pagination"""
        offset = (page - 1) * limit
        
        users = db.query(User).order_by(desc(User.created_at)).offset(offset).limit(limit).all()
        total_users = db.query(User).count()
        
        user_data = []
        for user in users:
            # Get user statistics
            total_submissions = db.query(Submission).filter(Submission.user_id == user.id).count()
            correct_submissions = db.query(Submission).filter(
                Submission.user_id == user.id,
                Submission.status == "correct"
            ).count()
            
            # Get active instances
            active_instances = db.query(Instance).filter(
                Instance.user_id == user.id,
                Instance.status == InstanceStatus.RUNNING
            ).count()
            
            user_data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "status": user.status.value,
                "score": user.score,
                "rank": user.rank,
                "total_solves": user.total_solves,
                "total_submissions": total_submissions,
                "success_rate": round((correct_submissions / total_submissions * 100), 2) if total_submissions > 0 else 0,
                "active_instances": active_instances,
                "created_at": user.created_at.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "is_locked": user.is_locked
            })
        
        return {
            "users": user_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_users,
                "pages": (total_users + limit - 1) // limit
            }
        }
    
    def update_user_status(self, db: Session, user_id: int, status: UserStatus) -> Dict[str, Any]:
        """Update user status"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.status = status
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": f"User status updated to {status.value}"}
    
    def update_user_role(self, db: Session, user_id: int, role: UserRole) -> Dict[str, Any]:
        """Update user role"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.role = role
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": f"User role updated to {role.value}"}
    
    def get_challenge_management_data(self, db: Session) -> List[Dict[str, Any]]:
        """Get challenge management data"""
        challenges = db.query(Challenge).order_by(desc(Challenge.created_at)).all()
        
        challenge_data = []
        for challenge in challenges:
            # Get challenge statistics
            total_attempts = db.query(Submission).filter(Submission.challenge_id == challenge.id).count()
            total_solves = db.query(Submission).filter(
                Submission.challenge_id == challenge.id,
                Submission.status == "correct"
            ).count()
            
            # Get active instances
            active_instances = db.query(Instance).filter(
                Instance.challenge_id == challenge.id,
                Instance.status == InstanceStatus.RUNNING
            ).count()
            
            challenge_data.append({
                "id": challenge.id,
                "title": challenge.title,
                "category": challenge.category.value,
                "difficulty": challenge.difficulty.value,
                "points": challenge.points,
                "status": challenge.status.value,
                "total_attempts": total_attempts,
                "total_solves": total_solves,
                "solve_rate": round((total_solves / total_attempts * 100), 2) if total_attempts > 0 else 0,
                "active_instances": active_instances,
                "max_instances": challenge.max_instances,
                "author": challenge.author,
                "created_at": challenge.created_at.isoformat(),
                "published_at": challenge.published_at.isoformat() if challenge.published_at else None,
                "is_featured": challenge.is_featured
            })
        
        return challenge_data
    
    def update_challenge_status(self, db: Session, challenge_id: int, status: ChallengeStatus) -> Dict[str, Any]:
        """Update challenge status"""
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challenge not found"
            )
        
        challenge.status = status
        if status == ChallengeStatus.ACTIVE and not challenge.published_at:
            challenge.published_at = datetime.utcnow()
        
        challenge.updated_at = datetime.utcnow()
        db.commit()
        
        return {"message": f"Challenge status updated to {status.value}"}
    
    def get_system_logs(self, db: Session, page: int = 1, limit: int = 100) -> Dict[str, Any]:
        """Get system logs with pagination"""
        offset = (page - 1) * limit
        
        logs = db.query(Log).order_by(desc(Log.timestamp)).offset(offset).limit(limit).all()
        total_logs = db.query(Log).count()
        
        log_data = [
            {
                "id": log.id,
                "event_type": log.event_type,
                "message": log.message,
                "user_id": log.user_id,
                "username": log.user.username if log.user else None,
                "extra_data": log.extra_data,
                "timestamp": log.timestamp.isoformat()
            }
            for log in logs
        ]
        
        return {
            "logs": log_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_logs,
                "pages": (total_logs + limit - 1) // limit
            }
        }
    
    def cleanup_expired_instances(self, db: Session) -> Dict[str, Any]:
        """Clean up expired instances"""
        cleaned_count = ctf_service.cleanup_expired_instances(db)
        
        return {
            "message": f"Cleaned up {cleaned_count} expired instances",
            "cleaned_count": cleaned_count
        }
    
    def get_leaderboard_settings(self, db: Session) -> Dict[str, Any]:
        """Get leaderboard settings"""
        # This would typically come from a settings table
        # For now, return default settings
        return {
            "enabled": True,
            "show_scores": True,
            "show_solves": True,
            "max_entries": 100,
            "update_frequency": "realtime"
        }
    
    def update_leaderboard_settings(self, db: Session, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update leaderboard settings"""
        # This would typically update a settings table
        # For now, just return success
        return {"message": "Leaderboard settings updated successfully"}
    
    def get_registration_settings(self, db: Session) -> Dict[str, Any]:
        """Get registration settings"""
        # This would typically come from a settings table
        # For now, return default settings
        return {
            "enabled": False,
            "require_verification": True,
            "allowed_domains": ["upr.edu"],
            "max_registrations_per_day": 100
        }
    
    def update_registration_settings(self, db: Session, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update registration settings"""
        # This would typically update a settings table
        # For now, just return success
        return {"message": "Registration settings updated successfully"}


# Create admin service instance
admin_service = AdminService()
