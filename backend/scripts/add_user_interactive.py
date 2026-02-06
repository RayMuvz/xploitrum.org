#!/usr/bin/env python3
"""
Add a user interactively: pass email as argument, script prompts for all other fields.
No @upr.edu requirement. User can log in immediately (no must_change_password).

Run from backend directory:
  python scripts/add_user_interactive.py EMAIL

Example:
  python scripts/add_user_interactive.py john@gmail.com
"""

import os
import sys
import getpass

# Add parent so app is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def prompt(text, default="", required=False):
    """Prompt for input. Optional default, optional required."""
    if default:
        line = input(f"{text} [{default}]: ").strip() or default
    else:
        line = input(f"{text}: ").strip()
    if required and not line:
        print("  This field is required.")
        return prompt(text, default, required)
    return line if line else None


def prompt_if_exists(value, param_name, check_exists_fn, get_new_prompt):
    """
    If value already exists in DB, prompt: "X already exists. Enter a different value? (Y/N)"
    - Y: prompt for new value (get_new_prompt), re-check until unique or user says N.
    - N: return None (caller should abort).
    Returns the value to use (original if unique, or new value), or None if user chose N.
    """
    while check_exists_fn(value):
        ans = input(f"  {param_name} '{value}' already exists. Enter a different value? (Y/N): ").strip().upper()
        if ans in ("N", "NO"):
            return None
        if ans in ("Y", "YES"):
            value = get_new_prompt()
            if not value:
                return None
        else:
            print("  Please answer Y or N.")
    return value


def prompt_password():
    """Prompt for password with confirmation."""
    while True:
        pwd = getpass.getpass("Password: ")
        if not pwd:
            print("  Password cannot be empty.")
            continue
        pwd2 = getpass.getpass("Confirm password: ")
        if pwd != pwd2:
            print("  Passwords do not match. Try again.")
            continue
        return pwd


def load_env():
    """Load DATABASE_URL from backend .env if present."""
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


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/add_user_interactive.py EMAIL")
        print("Example: python scripts/add_user_interactive.py john@gmail.com")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    if not email or "@" not in email:
        print("Error: a valid email is required.")
        sys.exit(1)

    load_env()

    # Open DB session early so we can check existence for email/username
    from passlib.context import CryptContext
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.user import User, UserRole, UserStatus

    database_url = os.environ.get("DATABASE_URL", "sqlite:///./xploitrum.db")
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()

    def email_exists(e):
        return session.query(User).filter(User.email == e).first() is not None

    def username_exists(u):
        return session.query(User).filter(User.username == u).first() is not None

    print("\n--- Add user (email: {}) ---\n".format(email))

    # Email: if already exists, prompt Y/N; if N abort, if Y ask for new email until unique
    email = prompt_if_exists(
        email, "Email", email_exists,
        lambda: input("  Enter new email: ").strip().lower()
    )
    if not email or "@" not in email:
        print("Aborted.")
        session.close()
        sys.exit(0)

    # Username: prompt then if exists, same Y/N flow
    username = prompt("Username", required=True)
    username = prompt_if_exists(
        username, "Username", username_exists,
        lambda: prompt("  Enter new username", required=True)
    )
    if not username:
        print("Aborted.")
        session.close()
        sys.exit(0)

    password = prompt_password()
    first_name = prompt("First name")
    last_name = prompt("Last name")
    full_name = None
    if first_name or last_name:
        full_name = " ".join(filter(None, [first_name, last_name])).strip() or None
    if not full_name:
        full_name = prompt("Full name (if not using first/last)")
    country = prompt("Country")
    university = prompt("University")
    bio = prompt("Bio (short)")
    github_username = prompt("GitHub username")
    linkedin_url = prompt("LinkedIn URL")
    website_url = prompt("Website URL")

    print("\n--- Summary ---")
    print("  Email:    ", email)
    print("  Username:", username)
    print("  Full name:", full_name or "(none)")
    print("  Country:  ", country or "(none)")
    print("  University:", university or "(none)")
    confirm = input("\nCreate this user? [y/N]: ").strip().lower()
    if confirm not in ("y", "yes"):
        print("Aborted.")
        session.close()
        sys.exit(0)

    try:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash(password)

        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            bio=bio,
            country=country,
            university=university,
            github_username=github_username,
            linkedin_url=linkedin_url if linkedin_url else None,
            website_url=website_url if website_url else None,
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            score=0,
            total_solves=0,
            total_attempts=0,
            failed_login_attempts=0,
            email_verified=False,
            must_change_password=False,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"\nUser created: id={user.id}, username={user.username}, email={user.email}")
        print("They can log in immediately (no password change required).")
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
