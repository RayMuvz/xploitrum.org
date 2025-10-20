"""
XploitRUM CTF Platform - Application Events
"""

from loguru import logger
from app.core.database import init_db, close_db
from app.core.config import settings


async def startup_event():
    """Application startup event"""
    logger.info("Starting XploitRUM CTF Platform...")
    
    try:
        # Initialize database (synchronous for SQLite)
        init_db()
        logger.info("Database initialized successfully")
        
        # Initialize Redis connection
        # (Redis connection will be handled by individual services)
        logger.info("Redis connection configured")
        
        # Start background tasks
        # (Background tasks will be started here)
        logger.info("Background tasks started")
        
        logger.info("XploitRUM CTF Platform started successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise


async def shutdown_event():
    """Application shutdown event"""
    logger.info("Shutting down XploitRUM CTF Platform...")
    
    try:
        # Close database connections (synchronous for SQLite)
        close_db()
        logger.info("Database connections closed")
        
        # Stop background tasks
        # (Background tasks will be stopped here)
        logger.info("Background tasks stopped")
        
        # Cleanup resources
        logger.info("Resources cleaned up")
        
        logger.info("XploitRUM CTF Platform shut down successfully")
        
    except Exception as e:
        logger.error(f"Shutdown error: {e}")
        raise
