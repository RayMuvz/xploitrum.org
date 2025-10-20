#!/usr/bin/env python3
"""
Create an admin user for XploitRUM CTF Platform
"""

import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.models.user import User, UserRole, UserStatus
from app.core.auth import get_password_hash, verify_password

def create_admin_user(username: str, email: str, password: str, full_name: str = "Admin User"):
    """Create an admin user"""
    
    # Initialize database first
    print("Initializing database...")
    init_db()
    
    # Create session
    db: Session = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"❌ User already exists: {existing_user.username}")
            print(f"   Updating existing user to admin...")
            existing_user.role = UserRole.ADMIN
            existing_user.status = UserStatus.ACTIVE
            db.commit()
            print(f"✅ User '{existing_user.username}' is now an admin!")
            return
        
        # Create new admin user
        admin_user = User(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            full_name=full_name,
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            email_verified=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Admin user created successfully!")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Role: {admin_user.role.value}")
        
        # Verify password works
        print(f"\n🔐 Testing password verification...")
        if verify_password(password, admin_user.password_hash):
            print(f"   ✅ Password verification works!")
        else:
            print(f"   ❌ WARNING: Password verification failed!")
        
        print(f"\n🔑 You can now login at: http://localhost:3000/login")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("XploitRUM CTF Platform - Create Admin User")
    print("=" * 50)
    print()
    
    # Get input or use defaults
    if len(sys.argv) > 1:
        username = sys.argv[1]
        email = sys.argv[2] if len(sys.argv) > 2 else f"{username}@xploitrum.org"
        password = sys.argv[3] if len(sys.argv) > 3 else "admin123"
        full_name = sys.argv[4] if len(sys.argv) > 4 else "Admin User"
    else:
        print("Using default admin credentials:")
        print("  Username: admin")
        print("  Email: admin@xploitrum.org")
        print("  Password: xploitRUM2025")
        print()
        print("To use custom credentials, run:")
        print("  python create_admin.py <username> <email> <password> <full_name>")
        print()
        
        username = "admin"
        email = "admin@xploitrum.org"
        password = "xploitRUM2025"
        full_name = "Admin User"
    
    create_admin_user(username, email, password, full_name)
    
    print()
    print("=" * 50)
