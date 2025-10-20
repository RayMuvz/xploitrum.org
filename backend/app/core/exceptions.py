"""
XploitRUM CTF Platform - Custom Exceptions
"""

from typing import Optional, Dict, Any


class XploitRUMException(Exception):
    """Base exception for XploitRUM platform"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(XploitRUMException):
    """Authentication related errors"""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTH_ERROR",
            status_code=401,
            details=details
        )


class AuthorizationError(XploitRUMException):
    """Authorization related errors"""
    
    def __init__(self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=403,
            details=details
        )


class ValidationError(XploitRUMException):
    """Validation related errors"""
    
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=details
        )


class NotFoundError(XploitRUMException):
    """Resource not found errors"""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            status_code=404,
            details=details
        )


class ConflictError(XploitRUMException):
    """Resource conflict errors"""
    
    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONFLICT_ERROR",
            status_code=409,
            details=details
        )


class RateLimitError(XploitRUMException):
    """Rate limiting errors"""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            status_code=429,
            details=details
        )


class DockerError(XploitRUMException):
    """Docker related errors"""
    
    def __init__(self, message: str = "Docker operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="DOCKER_ERROR",
            status_code=500,
            details=details
        )


class VPNError(XploitRUMException):
    """VPN related errors"""
    
    def __init__(self, message: str = "VPN operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VPN_ERROR",
            status_code=500,
            details=details
        )


class ChallengeError(XploitRUMException):
    """Challenge related errors"""
    
    def __init__(self, message: str = "Challenge operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CHALLENGE_ERROR",
            status_code=500,
            details=details
        )


class InstanceError(XploitRUMException):
    """Instance related errors"""
    
    def __init__(self, message: str = "Instance operation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="INSTANCE_ERROR",
            status_code=500,
            details=details
        )
