"""
XploitRUM CTF Platform - Database Configuration
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine if using SQLite or PostgreSQL
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Create engine (sync for SQLite, can be upgraded to async for PostgreSQL later)
if is_sqlite:
    # SQLite uses synchronous engine
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False}  # Needed for SQLite
    )
else:
    # PostgreSQL would use async engine (when psycopg2 is installed)
    engine = create_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://"),
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create declarative base
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    try:
        # Import all models here to ensure they are registered
        from app.models import user, challenge, instance, submission, log, event, member_request, pico_challenge
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise


def close_db():
    """Close database connections"""
    engine.dispose()
    logger.info("Database connections closed")
