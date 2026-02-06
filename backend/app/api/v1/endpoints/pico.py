"""
picoCTF-style challenges: static flags, +1 point per correct, public scoreboard.
"""

import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User, UserStatus, UserRole
from app.models.pico_challenge import PicoChallenge, PicoSubmission, PicoCategory, PicoDifficulty
from app.services.auth_service import get_current_active_user, get_current_admin_user


def _flag_pattern_to_regex(pattern: str) -> re.Pattern:
    """Convert flag pattern with * (alphanumeric) to regex. Case-sensitive match."""
    escaped = re.escape(pattern)
    regex_str = escaped.replace(r"\*", r"[a-zA-Z0-9]+")
    return re.compile("^" + regex_str + "$")


def _check_flag(submitted: str, pattern: str) -> bool:
    submitted = (submitted or "").strip()
    if not submitted:
        return False
    try:
        return _flag_pattern_to_regex(pattern).match(submitted) is not None
    except Exception:
        return False


router = APIRouter()

# --- Schemas ---
class PicoChallengeOut(BaseModel):
    id: int
    title: str
    category: str
    difficulty: str
    points: int
    is_solved: bool = False

    class Config:
        from_attributes = True


class PicoSubmitIn(BaseModel):
    flag: str


class PicoSubmitOut(BaseModel):
    correct: bool
    message: str
    new_score: Optional[int] = None


class ScoreboardEntry(BaseModel):
    rank: int
    username: str
    full_name: Optional[str]
    score: int
    total_solves: int


class PicoChallengeCreate(BaseModel):
    title: str
    category: str  # web_exploitation | reverse_engineering
    difficulty: str  # easy | medium | hard
    flag_pattern: str
    points: int = 1
    display_order: int = 0


class PicoChallengeUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    flag_pattern: Optional[str] = None
    points: Optional[int] = None
    display_order: Optional[int] = None


# --- Public: scoreboard (no auth) ---
@router.get("/scoreboard", response_model=List[ScoreboardEntry])
def get_scoreboard(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Public scoreboard: rank, username, score, total_solves (pico + existing). Excludes admin."""
    # Score is on User; exclude admin (they don't solve challenges); rank by score desc
    rows = (
        db.query(User)
        .filter(User.status == UserStatus.ACTIVE, User.role != UserRole.ADMIN)
        .order_by(desc(User.score), desc(User.total_solves))
        .limit(limit)
        .all()
    )
    return [
        ScoreboardEntry(
            rank=i + 1,
            username=u.username,
            full_name=u.full_name,
            score=u.score,
            total_solves=u.total_solves,
        )
        for i, u in enumerate(rows)
    ]


# --- Member: list challenges ---
@router.get("/challenges", response_model=List[PicoChallengeOut])
def list_challenges(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all pico challenges. Optional filters: category, difficulty."""
    q = db.query(PicoChallenge).order_by(PicoChallenge.display_order, PicoChallenge.id)
    if category:
        try:
            cat_enum = PicoCategory(category)
            q = q.filter(PicoChallenge.category == cat_enum)
        except ValueError:
            pass
    if difficulty:
        try:
            diff_enum = PicoDifficulty(difficulty)
            q = q.filter(PicoChallenge.difficulty == diff_enum)
        except ValueError:
            pass
    challenges = q.all()
    # Mark solved for this user
    out = []
    for c in challenges:
        solved = (
            db.query(PicoSubmission)
            .filter(
                PicoSubmission.user_id == current_user.id,
                PicoSubmission.pico_challenge_id == c.id,
                PicoSubmission.correct == 1,
            )
            .first()
            is not None
        )
        out.append(
            PicoChallengeOut(
                id=c.id,
                title=c.title,
                category=c.category.value,
                difficulty=c.difficulty.value,
                points=c.points,
                is_solved=solved,
            )
        )
    return out


# --- Member: submit flag ---
@router.post("/challenges/{challenge_id}/submit", response_model=PicoSubmitOut)
def submit_flag(
    challenge_id: int,
    body: PicoSubmitIn,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Submit a flag for a pico challenge. +1 point and +1 total_solves on correct (first solve per challenge)."""
    challenge = db.query(PicoChallenge).filter(PicoChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")

    already_solved = (
        db.query(PicoSubmission)
        .filter(
            PicoSubmission.user_id == current_user.id,
            PicoSubmission.pico_challenge_id == challenge_id,
            PicoSubmission.correct == 1,
        )
        .first()
    )
    if already_solved:
        return PicoSubmitOut(correct=True, message="Already solved", new_score=current_user.score)

    correct = _check_flag(body.flag, challenge.flag_pattern)
    # Record submission
    sub = PicoSubmission(
        user_id=current_user.id,
        pico_challenge_id=challenge_id,
        submitted_flag=body.flag[:500],
        correct=1 if correct else 0,
    )
    db.add(sub)

    if correct:
        current_user.score = (current_user.score or 0) + challenge.points
        current_user.total_solves = (current_user.total_solves or 0) + 1
        db.commit()
        db.refresh(current_user)
        return PicoSubmitOut(
            correct=True,
            message="Correct! +%d point(s)." % challenge.points,
            new_score=current_user.score,
        )

    db.commit()
    return PicoSubmitOut(correct=False, message="Incorrect flag.")


# --- Admin: CRUD ---
@router.get("/admin/challenges", response_model=List[dict])
def admin_list_challenges(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all pico challenges for admin (full fields)."""
    challenges = (
        db.query(PicoChallenge)
        .order_by(PicoChallenge.display_order, PicoChallenge.id)
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title,
            "category": c.category.value,
            "difficulty": c.difficulty.value,
            "flag_pattern": c.flag_pattern,
            "points": c.points,
            "display_order": c.display_order,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in challenges
    ]


@router.post("/admin/challenges", response_model=dict)
def admin_create_challenge(
    body: PicoChallengeCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a pico challenge (admin only)."""
    try:
        cat = PicoCategory(body.category)
        diff = PicoDifficulty(body.difficulty)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    c = PicoChallenge(
        title=body.title,
        category=cat,
        difficulty=diff,
        flag_pattern=body.flag_pattern.strip(),
        points=body.points,
        display_order=body.display_order,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "title": c.title,
        "category": c.category.value,
        "difficulty": c.difficulty.value,
        "flag_pattern": c.flag_pattern,
        "points": c.points,
        "display_order": c.display_order,
    }


@router.put("/admin/challenges/{challenge_id}", response_model=dict)
def admin_update_challenge(
    challenge_id: int,
    body: PicoChallengeUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update a pico challenge (admin only)."""
    c = db.query(PicoChallenge).filter(PicoChallenge.id == challenge_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
    if body.title is not None:
        c.title = body.title
    if body.category is not None:
        try:
            c.category = PicoCategory(body.category)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category")
    if body.difficulty is not None:
        try:
            c.difficulty = PicoDifficulty(body.difficulty)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid difficulty")
    if body.flag_pattern is not None:
        c.flag_pattern = body.flag_pattern.strip()
    if body.points is not None:
        c.points = body.points
    if body.display_order is not None:
        c.display_order = body.display_order
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "title": c.title,
        "category": c.category.value,
        "difficulty": c.difficulty.value,
        "flag_pattern": c.flag_pattern,
        "points": c.points,
        "display_order": c.display_order,
    }


@router.delete("/admin/challenges/{challenge_id}")
def admin_delete_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a pico challenge (admin only)."""
    c = db.query(PicoChallenge).filter(PicoChallenge.id == challenge_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
    db.delete(c)
    db.commit()
    return {"message": "Deleted"}


@router.get("/categories")
def get_categories():
    """Return category and difficulty options for frontend."""
    return {
        "categories": [
            {"value": "web_exploitation", "label": "Web Exploitation"},
            {"value": "reverse_engineering", "label": "Reverse Engineering"},
        ],
        "difficulties": [
            {"value": "easy", "label": "Easy"},
            {"value": "medium", "label": "Medium"},
            {"value": "hard", "label": "Hard"},
        ],
    }
