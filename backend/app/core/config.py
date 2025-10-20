"""
XploitRUM CTF Platform - Configuration Settings
"""

from typing import List, Optional, Union
from pydantic import field_validator, Field
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    PROJECT_NAME: str = "XploitRUM CTF Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "dev-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12
    
    # Database
    DATABASE_URL: str = "sqlite:///./xploitrum.db"
    DB_PASSWORD: str = ""
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    
    # These will be converted to lists by validators
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    FROM_EMAIL: str = "noreply@xploitrum.org"
    
    # Docker
    DOCKER_HOST: str = "unix:///var/run/docker.sock"
    CHALLENGE_NETWORK: str = "xploitrum_challenges"
    CHALLENGE_SUBNET: str = "172.20.0.0/16"
    
    # OpenVPN
    OPENVPN_SERVER_NAME: str = "xploitrum"
    OPENVPN_PROTOCOL: str = "udp"
    OPENVPN_PORT: int = 1194
    OPENVPN_NETWORK: str = "10.8.0.0"
    OPENVPN_SUBNET: str = "255.255.255.0"
    OPENVPN_CONFIG_PATH: str = "/etc/openvpn/server.conf"
    
    # CTF Configuration
    MAX_CONCURRENT_CHALLENGES: int = 50
    CHALLENGE_TIMEOUT_HOURS: int = 24
    AUTO_CLEANUP_INTERVAL: int = 3600
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Analytics
    GOOGLE_ANALYTICS_ID: Optional[str] = None
    PLAUSIBLE_DOMAIN: Optional[str] = None
    
    # Discord Integration
    DISCORD_BOT_TOKEN: Optional[str] = None
    DISCORD_WEBHOOK_URL: Optional[str] = None
    
    # URLs
    FRONTEND_URL: str = "https://www.xploitrum.org"
    API_URL: str = "https://api.xploitrum.org"
    CTF_URL: str = "https://ctf.xploitrum.org"
    LAB_URL: str = "https://lab.xploitrum.org"
    
    # Cloudflare
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    CLOUDFLARE_ZONE_ID: Optional[str] = None
    
    # ACME/Let's Encrypt
    ACME_EMAIL: str = "admin@xploitrum.org"
    
    # Backup
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_SCHEDULE: str = "0 2 * * *"
    S3_BACKUP_BUCKET: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: str) -> List[str]:
        if isinstance(v, str):
            # If it's a comma-separated string, split it
            if "," in v:
                return [i.strip() for i in v.split(",") if i.strip()]
            # If it's a single URL, return as list
            if v.strip():
                return [v.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000"]
    
    @field_validator("ALLOWED_HOSTS", mode="after")
    @classmethod
    def assemble_allowed_hosts(cls, v: str) -> List[str]:
        if isinstance(v, str):
            # If it's a comma-separated string, split it
            if "," in v:
                return [i.strip() for i in v.split(",") if i.strip()]
            # If it's a single host, return as list
            if v.strip():
                return [v.strip()]
        elif isinstance(v, list):
            return v
        return ["localhost"]
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"  # Ignore extra fields from .env
    }


# Create settings instance
settings = Settings()
