"""
picoCTF-style challenges (static flags, no Docker).
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PicoCategory(str, enum.Enum):
    WEB_EXPLOITATION = "web_exploitation"
    REVERSE_ENGINEERING = "reverse_engineering"


class PicoDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class PicoChallenge(Base):
    """Static picoCTF-style challenge (no instance)."""

    __tablename__ = "pico_challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    category = Column(Enum(PicoCategory), nullable=False, index=True)
    difficulty = Column(Enum(PicoDifficulty), nullable=False, index=True)
    # Flag pattern: * in string means [a-zA-Z0-9]+ when validating
    flag_pattern = Column(String(500), nullable=False)
    points = Column(Integer, default=1, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)  # for admin ordering

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    submissions = relationship("PicoSubmission", back_populates="challenge", cascade="all, delete-orphan")


class PicoSubmission(Base):
    """User submission for a pico challenge."""

    __tablename__ = "pico_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    pico_challenge_id = Column(Integer, ForeignKey("pico_challenges.id"), nullable=False, index=True)
    submitted_flag = Column(String(500), nullable=False)
    correct = Column(Integer, nullable=False)  # 1 = correct, 0 = wrong
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="pico_submissions")
    challenge = relationship("PicoChallenge", back_populates="submissions")
