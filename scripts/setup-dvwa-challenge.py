#!/usr/bin/env python3
"""
XploitRUM CTF Platform - DVWA Challenge Setup Script
This script sets up a fully functional DVWA challenge in the CTF platform
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db, init_db
from app.models.challenge import Challenge, ChallengeCategory, ChallengeDifficulty, ChallengeStatus
from app.models.user import User
from app.services.docker_service import DockerService
from sqlalchemy.orm import Session

async def setup_dvwa_challenge():
    """Set up DVWA challenge in the database"""
    
    print("🚀 Setting up DVWA Challenge for XploitRUM CTF Platform...")
    
    # Initialize database
    init_db()
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if DVWA challenge already exists
        existing_challenge = db.query(Challenge).filter(
            Challenge.title.ilike("%DVWA%")
        ).first()
        
        if existing_challenge:
            print(f"✅ DVWA challenge already exists: {existing_challenge.title}")
            return existing_challenge
        
        # Create DVWA challenge
        dvwa_challenge = Challenge(
            title="DVWA - Damn Vulnerable Web Application",
            description="""
# DVWA - Damn Vulnerable Web Application

Practice your web application security skills on this intentionally vulnerable PHP/MySQL web application.

★★★★★ **Perfect for learning web application security!** ★★★★★

## 🎯 Learning Objectives
- SQL Injection (Blind & Union-based)
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- File Inclusion Vulnerabilities
- Command Injection
- Weak Session Management
- Brute Force Attacks

## 🔧 Setup Instructions
1. Click "Start Machine" to deploy your DVWA instance
2. Access the web interface via the provided URL
3. Default credentials: `admin` / `password`
4. Configure security level as needed
5. Start practicing your penetration testing skills!

## 🏆 Challenge Goal
Find the hidden flag by exploiting the vulnerabilities in the application.
Look for SQL injection opportunities in the database or file inclusion vulnerabilities.

## 📚 Resources
- [DVWA Official Documentation](http://www.dvwa.co.uk/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

**Happy Hacking! 🔓**
            """,
            category=ChallengeCategory.WEB,
            difficulty=ChallengeDifficulty.EASY,
            points=100,
            flag="flag{dvwa_sql_injection_master}",
            author="XploitRUM Team",
            
            # Docker configuration for DVWA
            docker_image="vulnerables/web-dvwa",
            docker_ports=[
                {"internal": "80", "protocol": "tcp"}
            ],
            docker_environment={
                "MYSQL_ROOT_PASSWORD": "password",
                "MYSQL_DATABASE": "dvwa",
                "MYSQL_USER": "dvwa",
                "MYSQL_PASSWORD": "password"
            },
            docker_volumes={
                "/var/lib/mysql": {"type": "volume", "source": "dvwa_mysql_data"},
                "/var/www/html": {"type": "volume", "source": "dvwa_web_data"}
            },
            
            # Challenge configuration
            max_instances=20,  # Allow 20 concurrent instances
            instance_timeout=7200,  # 2 hours timeout
            max_solves=None,  # Unlimited solves
            
            # Additional configuration
            tags=["web", "sql-injection", "xss", "csrf", "file-inclusion", "beginner"],
            hints=[
                {
                    "text": "Check the SQL Injection module - try different payloads",
                    "cost": 10
                },
                {
                    "text": "Look for UNION-based SQL injection opportunities",
                    "cost": 20
                },
                {
                    "text": "The flag is stored in the database, not in files",
                    "cost": 30
                }
            ],
            
            # Status
            status=ChallengeStatus.ACTIVE,
            is_featured=True,
            is_premium=False
        )
        
        db.add(dvwa_challenge)
        db.commit()
        db.refresh(dvwa_challenge)
        
        print(f"✅ Created DVWA challenge: {dvwa_challenge.title}")
        print(f"   - ID: {dvwa_challenge.id}")
        print(f"   - Points: {dvwa_challenge.points}")
        print(f"   - Category: {dvwa_challenge.category.value}")
        print(f"   - Difficulty: {dvwa_challenge.difficulty.value}")
        print(f"   - Docker Image: {dvwa_challenge.docker_image}")
        print(f"   - Max Instances: {dvwa_challenge.max_instances}")
        
        return dvwa_challenge
        
    except Exception as e:
        print(f"❌ Error setting up DVWA challenge: {e}")
        db.rollback()
        raise
    finally:
        db.close()

async def test_dvwa_deployment():
    """Test DVWA deployment"""
    print("\n🧪 Testing DVWA deployment...")
    
    docker_service = DockerService()
    
    if not docker_service.is_available:
        print("⚠️  Docker not available - skipping deployment test")
        return
    
    try:
        # Test pulling the DVWA image
        print("📥 Pulling DVWA Docker image...")
        image = docker_service.client.images.pull("vulnerables/web-dvwa")
        print(f"✅ Successfully pulled image: {image.tags[0] if image.tags else image.id}")
        
        # Test creating a temporary container
        print("🚀 Testing container creation...")
        container = docker_service.client.containers.run(
            image="vulnerables/web-dvwa",
            name="dvwa-test",
            ports={"80/tcp": None},
            environment={
                "MYSQL_ROOT_PASSWORD": "password",
                "MYSQL_DATABASE": "dvwa",
                "MYSQL_USER": "dvwa",
                "MYSQL_PASSWORD": "password"
            },
            detach=True,
            remove=True
        )
        
        print(f"✅ Container created successfully: {container.id}")
        
        # Wait a moment for container to start
        import time
        time.sleep(5)
        
        # Check container status
        container.reload()
        print(f"📊 Container status: {container.status}")
        
        # Stop and remove test container
        container.stop()
        print("🧹 Cleaned up test container")
        
    except Exception as e:
        print(f"❌ Error testing DVWA deployment: {e}")

async def main():
    """Main function"""
    print("🎯 XploitRUM CTF Platform - DVWA Challenge Setup")
    print("=" * 60)
    
    # Setup DVWA challenge in database
    challenge = await setup_dvwa_challenge()
    
    # Test deployment
    await test_dvwa_deployment()
    
    print("\n🎉 DVWA Challenge Setup Complete!")
    print("=" * 60)
    print("✅ DVWA challenge is now available in your CTF platform")
    print("✅ Users can deploy DVWA instances and practice web security")
    print("✅ Admin can manage the challenge via the admin panel")
    print("\n🚀 Next Steps:")
    print("1. Go to your CTF platform: https://ctf.xploitrum.org")
    print("2. Find the DVWA challenge in the Web category")
    print("3. Click 'Start Machine' to deploy an instance")
    print("4. Access the DVWA interface and start hacking!")
    print("\n📚 Default DVWA credentials: admin / password")

if __name__ == "__main__":
    asyncio.run(main())
