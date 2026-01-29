"""
XploitRUM CTF Platform - Main FastAPI Application
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import logging
import os
from pathlib import Path
from loguru import logger

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api import api_router
from app.core.exceptions import XploitRUMException
from app.core.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.core.events import startup_event, shutdown_event


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Create necessary directories
    Path("static").mkdir(exist_ok=True)
    Path("uploads").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)
    
    # Startup
    await startup_event()
    yield
    # Shutdown
    await shutdown_event()


# Create FastAPI application
app = FastAPI(
    title="XploitRUM CTF Platform API",
    description="Professional cybersecurity organization website and CTF platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(SecurityHeadersMiddleware)
# app.add_middleware(RateLimitMiddleware)  # Disabled - requires Redis

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(XploitRUMException)
async def xploitrum_exception_handler(request: Request, exc: XploitRUMException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Include both "detail" (FastAPI default) and "message" for client compatibility
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": detail,
            "detail": detail,
            "details": None
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "XploitRUM CTF Platform API",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "Documentation not available in production",
        "health": "/health"
    }

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Create static directory if it doesn't exist
Path("static").mkdir(exist_ok=True)
Path("uploads").mkdir(exist_ok=True)

# Mount static files (for file uploads, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
