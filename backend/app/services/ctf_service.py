"""
XploitRUM CTF Platform - CTF Service
"""

import docker
import json
import time
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserStatus, UserRole
from app.models.challenge import Challenge, ChallengeStatus
from app.models.instance import Instance, InstanceStatus
from app.models.submission import Submission
from app.core.config import settings
from app.services.docker_service import DockerService

class CTFService:
    """CTF service for managing challenges and instances"""
    
    def __init__(self):
        self.docker_service = DockerService()
    
    def get_available_challenges(self, db: Session, user: User) -> List[Challenge]:
        """Get all available challenges for a user"""
        challenges = db.query(Challenge).filter(
            Challenge.status == ChallengeStatus.ACTIVE
        ).order_by(Challenge.points.desc()).all()
        
        # Add solve status for each challenge
        for challenge in challenges:
            existing_submission = db.query(Submission).filter(
                Submission.user_id == user.id,
                Submission.challenge_id == challenge.id,
                Submission.status == "correct"
            ).first()
            challenge.is_solved = existing_submission is not None
            
            # Check if user has an active instance
            active_instance = db.query(Instance).filter(
                Instance.user_id == user.id,
                Instance.challenge_id == challenge.id,
                Instance.status == InstanceStatus.RUNNING
            ).first()
            challenge.has_active_instance = active_instance is not None
        
        return challenges
    
    def deploy_challenge_instance(self, db: Session, user: User, challenge_id: int) -> Dict[str, Any]:
        """Deploy a new challenge instance for a user"""
        print(f"DEBUG CTF Service: Deploying challenge {challenge_id} for user {user.username} (ID: {user.id})")
        
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        if not challenge:
            print(f"DEBUG CTF Service: Challenge {challenge_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challenge not found"
            )
        
        print(f"DEBUG CTF Service: Challenge found: {challenge.title}, status: {challenge.status}")
        print(f"DEBUG CTF Service: Status check - ChallengeStatus.ACTIVE: {ChallengeStatus.ACTIVE}, challenge.status: {challenge.status}")
        
        # Convert status to string for comparison
        if hasattr(challenge.status, 'value'):
            status_str = challenge.status.value
        else:
            status_str = str(challenge.status)
        print(f"DEBUG CTF Service: Status string: {status_str}")
        
        if status_str not in ["active", "ACTIVE"]:
            print(f"DEBUG CTF Service: Challenge status '{status_str}' is not active")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Challenge is not active"
            )
        
        # Check if user already has ANY active instance (only one at a time allowed)
        # Skip this check for anonymous users (user.id is None)
        if user.id is not None:
            # Check for any active instance (not just this challenge)
            any_active_instance = db.query(Instance).filter(
                Instance.user_id == user.id,
                Instance.status == InstanceStatus.RUNNING
            ).first()
            
            if any_active_instance:
                # Get the challenge name for the active instance
                active_challenge = db.query(Challenge).filter(
                    Challenge.id == any_active_instance.challenge_id
                ).first()
                
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"You already have an active instance running: {active_challenge.title if active_challenge else 'Unknown'}. Please stop it before starting a new one."
                )
        
        # Check if challenge has reached max instances
        active_instances = db.query(Instance).filter(
            Instance.challenge_id == challenge_id,
            Instance.status == InstanceStatus.RUNNING
        ).count()
        
        if active_instances >= challenge.max_instances:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Maximum instances reached for this challenge"
            )
        
        try:
            # Generate unique instance name
            instance_name = f"{challenge.title.lower().replace(' ', '-')}-{user.username}-{uuid.uuid4().hex[:8]}"
            print(f"DEBUG CTF Service: Generated instance name: {instance_name}")
            
            # Deploy Docker container using docker client directly
            if not self.docker_service.is_available:
                # SIMULATION MODE: Docker not available, create mock instance
                print("DEBUG CTF Service: Docker not available, using simulation mode")
                mock_container_id = f"mock-{uuid.uuid4().hex[:12]}"
                mock_ip = f"172.20.0.{random.randint(10, 250)}"
                
                print(f"DEBUG CTF Service: Creating instance record with mock container")
                instance = Instance(
                    user_id=user.id,
                    challenge_id=challenge_id,
                    container_id=mock_container_id,
                    container_name=instance_name,
                    status=InstanceStatus.RUNNING,
                    started_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(seconds=challenge.instance_timeout)
                )
                
                db.add(instance)
                db.commit()
                db.refresh(instance)
                
                return {
                    "instance_id": instance.id,
                    "container_id": mock_container_id,
                    "container_name": instance_name,
                    "status": "running",
                    "ports": {"80/tcp": [{"HostIp": "0.0.0.0", "HostPort": str(random.randint(8000, 9000))}]},
                    "ip_address": mock_ip,
                    "expires_at": instance.expires_at.isoformat(),
                    "challenge_info": {
                        "title": challenge.title,
                        "category": challenge.category.value,
                        "difficulty": challenge.difficulty.value,
                        "points": challenge.points
                    },
                    "note": "SIMULATION MODE - Docker not available"
                }
            
            print(f"DEBUG CTF Service: Starting Docker container deployment")
            container = self.docker_service.client.containers.run(
                image=challenge.docker_image,
                name=instance_name,
                environment=challenge.docker_environment or {},
                ports=challenge.docker_ports or {},
                volumes=challenge.docker_volumes or {},
                network=settings.CHALLENGE_NETWORK,
                detach=True,
                labels={
                    "challenge_id": str(challenge_id),
                    "user_id": str(user.id) if user.id else "anonymous",
                    "managed_by": "xploitrum"
                }
            )
            print(f"DEBUG CTF Service: Container created: {container.id}")
            
            # Create instance record
            print(f"DEBUG CTF Service: Creating instance record with user_id={user.id}")
            instance = Instance(
                user_id=user.id,
                challenge_id=challenge_id,
                container_id=container.id,
                container_name=instance_name,
                status=InstanceStatus.RUNNING,
                started_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(seconds=challenge.instance_timeout)
            )
            
            print(f"DEBUG CTF Service: Adding instance to database")
            db.add(instance)
            print(f"DEBUG CTF Service: Committing to database")
            db.commit()
            print(f"DEBUG CTF Service: Refreshing instance")
            db.refresh(instance)
            
            # Get container info
            container.reload()
            container_ip = None
            if container.attrs.get("NetworkSettings", {}).get("Networks", {}).get(settings.CHALLENGE_NETWORK):
                container_ip = container.attrs["NetworkSettings"]["Networks"][settings.CHALLENGE_NETWORK]["IPAddress"]
            
            container_info = {
                "ports": container.attrs.get("NetworkSettings", {}).get("Ports", {}),
                "ip_address": container_ip
            }
            
            return {
                "instance_id": instance.id,
                "container_id": container.id,
                "container_name": instance_name,
                "status": instance.status.value,
                "ports": container_info.get("ports", {}),
                "ip_address": container_info.get("ip_address"),
                "expires_at": instance.expires_at.isoformat(),
                "challenge_info": {
                    "title": challenge.title,
                    "category": challenge.category.value,
                    "difficulty": challenge.difficulty.value,
                    "points": challenge.points
                }
            }
            
        except Exception as e:
            print(f"DEBUG CTF Service: Exception occurred: {str(e)}")
            print(f"DEBUG CTF Service: Exception type: {type(e)}")
            import traceback
            print(f"DEBUG CTF Service: Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to deploy instance: {str(e)}"
            )
    
    def stop_challenge_instance(self, db: Session, user: User, instance_id: int) -> Dict[str, Any]:
        """Stop a challenge instance"""
        instance = db.query(Instance).filter(
            Instance.id == instance_id,
            Instance.user_id == user.id
        ).first()
        
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instance not found"
            )
        
        if instance.status != InstanceStatus.RUNNING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instance is not running"
            )
        
        try:
            # Stop and remove Docker container
            container = self.docker_service.client.containers.get(instance.container_id)
            container.stop(timeout=10)
            container.remove(force=True)
            
            # Update instance status
            instance.status = InstanceStatus.STOPPED
            instance.stopped_at = datetime.utcnow()
            db.commit()
            
            return {
                "message": "Instance stopped successfully",
                "instance_id": instance.id
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to stop instance: {str(e)}"
            )
    
    def submit_flag(self, db: Session, user: User, challenge_id: int, flag: str) -> Dict[str, Any]:
        """Submit a flag for a challenge"""
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challenge not found"
            )
        
        # Convert status to string for comparison
        if hasattr(challenge.status, 'value'):
            status_str = challenge.status.value
        else:
            status_str = str(challenge.status)
        
        if status_str not in ["active", "ACTIVE"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Challenge is not active"
            )
        
        # Check if user already solved this challenge
        existing_submission = db.query(Submission).filter(
            Submission.user_id == user.id,
            Submission.challenge_id == challenge_id,
            Submission.status == "correct"
        ).first()
        
        if existing_submission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already solved this challenge"
            )
        
        # Check if challenge has reached max solves
        if challenge.max_solves:
            current_solves = db.query(Submission).filter(
                Submission.challenge_id == challenge_id,
                Submission.status == "correct"
            ).count()
            
            if current_solves >= challenge.max_solves:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Challenge has reached maximum solves"
                )
        
        # Verify flag (in real implementation, this should be encrypted)
        is_correct = flag.strip() == challenge.flag.strip()
        
        # Create submission record
        submission = Submission(
            user_id=user.id,
            challenge_id=challenge_id,
            flag=flag,
            status="correct" if is_correct else "incorrect",
            submitted_at=datetime.utcnow()
        )
        
        db.add(submission)
        
        # Update challenge statistics
        challenge.total_attempts += 1
        if is_correct:
            challenge.total_solves += 1
            user.score += challenge.points
            user.total_solves += 1
            
            # Update user rank
            self.update_user_rank(db, user.id)
        
        user.total_attempts += 1
        
        db.commit()
        db.refresh(submission)
        
        return {
            "correct": is_correct,
            "points": challenge.points if is_correct else 0,
            "message": "Correct flag!" if is_correct else "Incorrect flag. Try again!",
            "submission_id": submission.id
        }
    
    def get_user_instances(self, db: Session, user: User) -> List[Dict[str, Any]]:
        """Get all instances for a user"""
        instances = db.query(Instance).filter(
            Instance.user_id == user.id
        ).order_by(Instance.created_at.desc()).all()
        
        result = []
        for instance in instances:
            challenge = db.query(Challenge).filter(Challenge.id == instance.challenge_id).first()
            
            instance_data = {
                "id": instance.id,
                "challenge_title": challenge.title if challenge else "Unknown",
                "challenge_category": challenge.category.value if challenge else "unknown",
                "status": instance.status.value,
                "started_at": instance.started_at.isoformat(),
                "expires_at": instance.expires_at.isoformat() if instance.expires_at else None,
                "container_name": instance.container_name
            }
            
            # Add container info if running
            if instance.status == InstanceStatus.RUNNING:
                try:
                    container = self.docker_service.client.containers.get(instance.container_id)
                    container.reload()
                    container_ip = None
                    if container.attrs.get("NetworkSettings", {}).get("Networks", {}).get(settings.CHALLENGE_NETWORK):
                        container_ip = container.attrs["NetworkSettings"]["Networks"][settings.CHALLENGE_NETWORK]["IPAddress"]
                    
                    instance_data.update({
                        "ports": container.attrs.get("NetworkSettings", {}).get("Ports", {}),
                        "ip_address": container_ip,
                        "status_details": container.status
                    })
                except:
                    pass
            
            result.append(instance_data)
        
        return result
    
    def get_leaderboard(self, db: Session, limit: int = 100) -> List[Dict[str, Any]]:
        """Get leaderboard data (excludes admin)."""
        users = db.query(User).filter(
            User.status == UserStatus.ACTIVE,
            User.role != UserRole.ADMIN,
            User.score > 0
        ).order_by(User.score.desc(), User.total_solves.desc()).limit(limit).all()
        
        leaderboard = []
        for rank, user in enumerate(users, 1):
            leaderboard.append({
                "rank": rank,
                "username": user.username,
                "full_name": user.full_name,
                "score": user.score,
                "total_solves": user.total_solves,
                "university": user.university,
                "country": user.country,
                "avatar_url": user.avatar_url
            })
        
        return leaderboard
    
    def update_user_rank(self, db: Session, user_id: int):
        """Update user rank based on score"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        
        # Count non-admin users with higher scores
        higher_score_count = db.query(User).filter(
            User.score > user.score,
            User.status == UserStatus.ACTIVE,
            User.role != UserRole.ADMIN
        ).count()
        
        user.rank = higher_score_count + 1
        db.commit()
    
    def cleanup_expired_instances(self, db: Session):
        """Clean up expired instances"""
        expired_instances = db.query(Instance).filter(
            Instance.status == InstanceStatus.RUNNING,
            Instance.expires_at < datetime.utcnow()
        ).all()
        
        for instance in expired_instances:
            try:
                # Stop and remove Docker container
                container = self.docker_service.client.containers.get(instance.container_id)
                container.stop(timeout=10)
                container.remove(force=True)
                
                # Update instance status
                instance.status = InstanceStatus.EXPIRED
                instance.stopped_at = datetime.utcnow()
                
            except Exception as e:
                # Log error but continue
                print(f"Error cleaning up instance {instance.id}: {str(e)}")
        
        db.commit()
        return len(expired_instances)


# Create CTF service instance
ctf_service = CTFService()
