"""
XploitRUM CTF Platform - Custom Middleware
"""

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
import redis
import json
from typing import Dict, Any
from loguru import logger

from app.core.config import settings
from app.core.exceptions import RateLimitError


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.xploitrum.org; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL)
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier
        client_ip = request.client.host
        user_id = getattr(request.state, "user_id", None)
        identifier = f"user:{user_id}" if user_id else f"ip:{client_ip}"
        
        # Check rate limit
        if await self._is_rate_limited(identifier):
            raise RateLimitError(
                message="Too many requests. Please try again later.",
                details={"retry_after": 60}
            )
        
        # Process request
        response = await call_next(request)
        
        # Record request
        await self._record_request(identifier)
        
        return response
    
    async def _is_rate_limited(self, identifier: str) -> bool:
        """Check if identifier is rate limited"""
        if not self.redis_client:
            return False
        
        try:
            key = f"rate_limit:{identifier}"
            current_requests = self.redis_client.get(key)
            
            if current_requests is None:
                return False
            
            return int(current_requests) >= settings.RATE_LIMIT_PER_MINUTE
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return False
    
    async def _record_request(self, identifier: str):
        """Record a request for rate limiting"""
        if not self.redis_client:
            return
        
        try:
            key = f"rate_limit:{identifier}"
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)  # 1 minute window
            pipe.execute()
        except Exception as e:
            logger.error(f"Rate limit recording error: {e}")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Request/response logging middleware"""
    
    async def dispatch(self, request: Request, call_next):
        # Start time
        start_time = time.time()
        
        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host,
                "user_agent": request.headers.get("user-agent"),
            }
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {response.status_code} in {process_time:.3f}s",
            extra={
                "status_code": response.status_code,
                "process_time": process_time,
                "response_size": response.headers.get("content-length", 0),
            }
        )
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(f"Unhandled error: {e}", exc_info=True)
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "An internal server error occurred",
                    "details": None
                }
            )
