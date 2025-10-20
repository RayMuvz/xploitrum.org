"""
XploitRUM CTF Platform - Security Utilities
"""

import hashlib
import secrets
from cryptography.fernet import Fernet
from passlib.context import CryptContext
from app.core.config import settings
from loguru import logger

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Flag encryption key (should be generated and stored securely)
FLAG_ENCRYPTION_KEY = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')
fernet = Fernet(Fernet.generate_key())  # In production, use a proper key


def encrypt_flag(flag: str) -> str:
    """Encrypt a flag for storage"""
    try:
        encrypted_flag = fernet.encrypt(flag.encode())
        return encrypted_flag.decode()
    except Exception as e:
        logger.error(f"Failed to encrypt flag: {e}")
        raise


def decrypt_flag(encrypted_flag: str) -> str:
    """Decrypt a flag"""
    try:
        decrypted_flag = fernet.decrypt(encrypted_flag.encode())
        return decrypted_flag.decode()
    except Exception as e:
        logger.error(f"Failed to decrypt flag: {e}")
        raise


def verify_flag(submitted_flag: str, stored_flag: str) -> bool:
    """Verify a submitted flag against the stored encrypted flag"""
    try:
        decrypted_flag = decrypt_flag(stored_flag)
        return submitted_flag.strip() == decrypted_flag.strip()
    except Exception as e:
        logger.error(f"Flag verification failed: {e}")
        return False


def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)


def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def sanitize_input(input_string: str) -> str:
    """Sanitize user input to prevent XSS and other attacks"""
    if not input_string:
        return ""
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`', '$']
    sanitized = input_string
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()


def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_username(username: str) -> bool:
    """Validate username format"""
    import re
    # Username should be 3-20 characters, alphanumeric and underscores only
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None


def generate_challenge_flag() -> str:
    """Generate a random flag for challenges"""
    prefix = "XPLOITRUM{"
    suffix = "}"
    
    # Generate random string
    random_part = secrets.token_hex(16)
    
    return f"{prefix}{random_part}{suffix}"


def calculate_flag_hash(flag: str) -> str:
    """Calculate hash of a flag for verification"""
    return hashlib.sha256(flag.encode()).hexdigest()


def is_safe_filename(filename: str) -> bool:
    """Check if filename is safe for upload"""
    if not filename:
        return False
    
    # Check for path traversal attempts
    dangerous_patterns = ['../', '..\\', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
    
    for pattern in dangerous_patterns:
        if pattern in filename:
            return False
    
    # Check file extension
    allowed_extensions = ['.txt', '.pdf', '.zip', '.tar.gz', '.png', '.jpg', '.jpeg']
    filename_lower = filename.lower()
    
    return any(filename_lower.endswith(ext) for ext in allowed_extensions)


def rate_limit_key(identifier: str, endpoint: str) -> str:
    """Generate rate limit key"""
    return f"rate_limit:{endpoint}:{identifier}"


def get_client_ip(request) -> str:
    """Get client IP address from request"""
    # Check for forwarded headers (when behind proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    return request.client.host if request.client else "unknown"


def is_admin_action(action: str) -> bool:
    """Check if action requires admin privileges"""
    admin_actions = [
        "create_challenge",
        "update_challenge",
        "delete_challenge",
        "manage_users",
        "view_logs",
        "system_settings",
        "backup_data"
    ]
    return action in admin_actions


def generate_vpn_username(user_id: int) -> str:
    """Generate VPN username for user"""
    return f"user_{user_id}"


def generate_vpn_password(length: int = 12) -> str:
    """Generate VPN password"""
    # Use a mix of letters, numbers, and special characters
    import string
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))


def validate_challenge_flag(flag: str) -> bool:
    """Validate challenge flag format"""
    if not flag:
        return False
    
    # Check if flag starts and ends with XPLOITRUM{}
    if not flag.startswith("XPLOITRUM{") or not flag.endswith("}"):
        return False
    
    # Check flag length (should be reasonable)
    if len(flag) < 20 or len(flag) > 100:
        return False
    
    return True
