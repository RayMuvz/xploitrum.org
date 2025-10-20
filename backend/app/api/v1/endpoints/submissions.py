"""
XploitRUM CTF Platform - Submission Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.challenge import Challenge
from app.models.submission import Submission, SubmissionStatus
from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import verify_flag

router = APIRouter()


class SubmissionResponse(BaseModel):
    id: int
    challenge_id: int
    challenge_title: str
    status: SubmissionStatus
    points_awarded: int
    submitted_at: str


class SubmissionCreate(BaseModel):
    challenge_id: int
    flag: str


@router.post("/", response_model=SubmissionResponse)
async def submit_flag(
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit flag for challenge"""
    try:
        # Get challenge
        challenge = await db.get(Challenge, submission_data.challenge_id)
        if not challenge:
            raise NotFoundError("Challenge not found")
        
        # Check if user already solved this challenge
        existing_submission = await db.execute(
            select(Submission).where(
                and_(
                    Submission.user_id == current_user.id,
                    Submission.challenge_id == submission_data.challenge_id,
                    Submission.status == SubmissionStatus.CORRECT
                )
            )
        )
        if existing_submission.scalar_one_or_none():
            return SubmissionResponse(
                id=0,
                challenge_id=challenge.id,
                challenge_title=challenge.title,
                status=SubmissionStatus.DUPLICATE,
                points_awarded=0,
                submitted_at=datetime.utcnow().isoformat()
            )
        
        # Verify flag
        is_correct = verify_flag(submission_data.flag, challenge.flag)
        
        # Create submission
        submission_status = SubmissionStatus.CORRECT if is_correct else SubmissionStatus.INCORRECT
        points_awarded = challenge.points if is_correct else 0
        
        new_submission = Submission(
            user_id=current_user.id,
            challenge_id=submission_data.challenge_id,
            flag=submission_data.flag,
            status=submission_status,
            points_awarded=points_awarded
        )
        
        db.add(new_submission)
        
        # Update user score and challenge statistics if correct
        if is_correct:
            current_user.score += points_awarded
            current_user.total_solves += 1
            challenge.total_solves += 1
        
        # Update attempt statistics
        current_user.total_attempts += 1
        challenge.total_attempts += 1
        
        # Update solve percentage
        challenge.solve_percentage = challenge.get_solve_rate()
        
        await db.commit()
        await db.refresh(new_submission)
        
        return SubmissionResponse(
            id=new_submission.id,
            challenge_id=new_submission.challenge_id,
            challenge_title=challenge.title,
            status=new_submission.status,
            points_awarded=new_submission.points_awarded,
            submitted_at=new_submission.submitted_at.isoformat()
        )
        
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit flag"
        )


@router.get("/", response_model=List[SubmissionResponse])
async def get_user_submissions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's submissions"""
    try:
        stmt = select(Submission, Challenge).join(
            Challenge, Submission.challenge_id == Challenge.id
        ).where(
            Submission.user_id == current_user.id
        ).order_by(Submission.submitted_at.desc()).offset(offset).limit(limit)
        
        result = await db.execute(stmt)
        submissions_data = result.all()
        
        submissions = []
        for submission, challenge in submissions_data:
            submissions.append(SubmissionResponse(
                id=submission.id,
                challenge_id=submission.challenge_id,
                challenge_title=challenge.title,
                status=submission.status,
                points_awarded=submission.points_awarded,
                submitted_at=submission.submitted_at.isoformat()
            ))
        
        return submissions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get submissions"
        )


@router.get("/stats")
async def get_submission_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user submission statistics"""
    try:
        # Get total submissions
        total_submissions = await db.execute(
            select(func.count(Submission.id)).where(Submission.user_id == current_user.id)
        )
        total_count = total_submissions.scalar()
        
        # Get correct submissions
        correct_submissions = await db.execute(
            select(func.count(Submission.id)).where(
                and_(
                    Submission.user_id == current_user.id,
                    Submission.status == SubmissionStatus.CORRECT
                )
            )
        )
        correct_count = correct_submissions.scalar()
        
        # Get accuracy percentage
        accuracy = (correct_count / total_count * 100) if total_count > 0 else 0
        
        # Get recent submissions (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_submissions = await db.execute(
            select(func.count(Submission.id)).where(
                and_(
                    Submission.user_id == current_user.id,
                    Submission.submitted_at >= week_ago
                )
            )
        )
        recent_count = recent_submissions.scalar()
        
        return {
            "total_submissions": total_count,
            "correct_submissions": correct_count,
            "accuracy_percentage": round(accuracy, 2),
            "recent_submissions": recent_count,
            "total_score": current_user.score,
            "total_solves": current_user.total_solves
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get submission stats"
        )


# Admin endpoints
@router.get("/admin/all", response_model=List[SubmissionResponse])
async def get_all_submissions(
    limit: int = 100,
    offset: int = 0,
    challenge_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status: Optional[SubmissionStatus] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all submissions (admin only)"""
    try:
        query = select(Submission, Challenge).join(
            Challenge, Submission.challenge_id == Challenge.id
        )
        
        # Apply filters
        filters = []
        if challenge_id:
            filters.append(Submission.challenge_id == challenge_id)
        if user_id:
            filters.append(Submission.user_id == user_id)
        if status:
            filters.append(Submission.status == status)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(Submission.submitted_at.desc()).offset(offset).limit(limit)
        
        result = await db.execute(query)
        submissions_data = result.all()
        
        submissions = []
        for submission, challenge in submissions_data:
            submissions.append(SubmissionResponse(
                id=submission.id,
                challenge_id=submission.challenge_id,
                challenge_title=challenge.title,
                status=submission.status,
                points_awarded=submission.points_awarded,
                submitted_at=submission.submitted_at.isoformat()
            ))
        
        return submissions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get submissions"
        )
