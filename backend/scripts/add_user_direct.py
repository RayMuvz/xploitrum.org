#!/usr/bin/env python3
"""
Add a user directly to the database with any email and a final password.
No @upr.edu requirement, no must_change_password. User can log in immediately.

Run from backend directory:
  python scripts/add_user_direct.py USERNAME EMAIL PASSWORD

Example:
  python scripts/add_user_direct.py jdoe john@gmail.com MySecurePass123
"""

import os
import sys

# Add parent so app is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def main():
    if len(sys.argv) != 4:
        print("Usage: python scripts/add_user_direct.py USERNAME EMAIL PASSWORD")
        print("Example: python scripts/add_user_direct.py jdoe john@gmail.com MySecurePass123")
        sys.exit(1)

    username = sys.argv[1].strip()
    email = sys.argv[2].strip().lower()
    password = sys.argv[3]

    if not username or not email or not password:
        print("Error: username, email, and password are required.")
        sys.exit(1)

    # Load DATABASE_URL from .env if present
    from pathlib import Path
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    v = v.strip().strip('"').strip("'")
                    if k == "DATABASE_URL" and not os.environ.get("DATABASE_URL"):
                        os.environ["DATABASE_URL"] = v

    database_url = os.environ.get("DATABASE_URL", "sqlite:///./xploitrum.db")
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()

    try:
        # Check if username or email already exists
        from app.models.user import User, UserRole, UserStatus
        existing = session.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        if existing:
            print(f"Error: A user with username '{username}' or email '{email}' already exists.")
            sys.exit(1)

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash(password)

        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            score=0,
            total_solves=0,
            total_attempts=0,
            failed_login_attempts=0,
            email_verified=False,
            must_change_password=False,  # So they can log in directly
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"User created: id={user.id}, username={user.username}, email={user.email}")
        print("They can log in immediately with this password (no change required).")
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
