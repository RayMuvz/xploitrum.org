"""
XploitRUM CTF Platform - Log Model
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, JSON
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class LogLevel(str, enum.Enum):
    """Log level enumeration"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class LogEventType(str, enum.Enum):
    """Log event type enumeration"""
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTER = "user_register"
    CHALLENGE_DEPLOY = "challenge_deploy"
    CHALLENGE_STOP = "challenge_stop"
    FLAG_SUBMIT = "flag_submit"
    VPN_CONNECT = "vpn_connect"
    VPN_DISCONNECT = "vpn_disconnect"
    ADMIN_ACTION = "admin_action"
    SYSTEM_EVENT = "system_event"
    ERROR = "error"


class Log(Base):
    """Log model for system and user activity logging"""
    
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Log details
    event_type = Column(Enum(LogEventType), nullable=False, index=True)
    level = Column(Enum(LogLevel), default=LogLevel.INFO, nullable=False, index=True)
    message = Column(Text, nullable=False)
    
    # Context
    user_id = Column(Integer, nullable=True, index=True)  # Nullable for system events
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Additional data (renamed from 'metadata' to avoid SQLAlchemy conflict)
    extra_data = Column(JSON, nullable=True)  # Additional context data
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<Log(id={self.id}, event_type='{self.event_type}', level='{self.level}', message='{self.message[:50]}...')>"
