#!/usr/bin/env python3
"""
Check if admin user exists and test password
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.auth import verify_password
import sys

def check_user(username: str = "admin"):
    """Check if user exists and verify password"""
    
    db: Session = SessionLocal()
    
    try:
        # Find user
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print(f"❌ User '{username}' not found in database")
            return
        
        print(f"✅ User found:")
        print(f"   ID: {user.id}")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Full Name: {user.full_name}")
        print(f"   Role: {user.role.value}")
        print(f"   Status: {user.status.value}")
        print(f"   Active: {user.is_active}")
        print(f"   Admin: {user.is_admin}")
        print(f"   Locked: {user.is_locked}")
        print(f"   Password Hash: {user.password_hash[:50]}...")
        print()
        
        # Test password verification
        test_password = "xploitRUM2025"
        print(f"Testing password verification with '{test_password}'...")
        
        try:
            is_valid = verify_password(test_password, user.password_hash)
            if is_valid:
                print(f"✅ Password verification SUCCESSFUL")
            else:
                print(f"❌ Password verification FAILED")
                print(f"   The password hash in database doesn't match 'xploitRUM2025'")
        except Exception as e:
            print(f"❌ Error during password verification: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Error checking user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    username = sys.argv[1] if len(sys.argv) > 1 else "admin"
    check_user(username)

