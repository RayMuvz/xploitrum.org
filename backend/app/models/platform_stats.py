"""
Platform statistics model for managing custom stats
"""
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class PlatformStats(Base):
    __tablename__ = "platform_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    active_members = Column(Integer, default=0, nullable=False)
    total_challenges = Column(Integer, default=0, nullable=False)
    total_solves = Column(Integer, default=0, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

