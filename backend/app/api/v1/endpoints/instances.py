"""
XploitRUM CTF Platform - Instance Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.challenge import Challenge
from app.models.instance import Instance, InstanceStatus
from app.core.exceptions import NotFoundError, ValidationError, InstanceError
from app.services.docker_service import DockerService

router = APIRouter()


class InstanceResponse(BaseModel):
    id: int
    challenge_id: int
    challenge_title: str
    status: InstanceStatus
    instance_url: Optional[str] = None
    started_at: str
    expires_at: str
    time_remaining: int
    duration_minutes: int


class InstanceCreate(BaseModel):
    challenge_id: int


@router.get("/", response_model=List[InstanceResponse])
async def get_user_instances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's instances"""
    try:
        stmt = select(Instance, Challenge).join(
            Challenge, Instance.challenge_id == Challenge.id
        ).where(
            Instance.user_id == current_user.id
        ).order_by(Instance.started_at.desc())
        
        result = await db.execute(stmt)
        instances_data = result.all()
        
        instances = []
        for instance, challenge in instances_data:
            instances.append(InstanceResponse(
                id=instance.id,
                challenge_id=instance.challenge_id,
                challenge_title=challenge.title,
                status=instance.status,
                instance_url=instance.instance_url,
                started_at=instance.started_at.isoformat(),
                expires_at=instance.expires_at.isoformat(),
                time_remaining=instance.time_remaining,
                duration_minutes=instance.duration_minutes
            ))
        
        return instances
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get instances"
        )


@router.post("/", response_model=InstanceResponse)
async def create_instance(
    instance_data: InstanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new challenge instance"""
    try:
        # Get challenge
        challenge = await db.get(Challenge, instance_data.challenge_id)
        if not challenge:
            raise NotFoundError("Challenge not found")
        
        if not challenge.is_available:
            raise ValidationError("Challenge is not available for deployment")
        
        # Check if user already has an instance of this challenge
        existing_instance = await db.execute(
            select(Instance).where(
                and_(
                    Instance.user_id == current_user.id,
                    Instance.challenge_id == instance_data.challenge_id,
                    Instance.status.in_([InstanceStatus.STARTING, InstanceStatus.RUNNING])
                )
            )
        )
        if existing_instance.scalar_one_or_none():
            raise ValidationError("You already have an active instance of this challenge")
        
        # Check challenge instance limits
        active_instances = await db.execute(
            select(Instance).where(
                and_(
                    Instance.challenge_id == instance_data.challenge_id,
                    Instance.status.in_([InstanceStatus.STARTING, InstanceStatus.RUNNING])
                )
            )
        )
        if len(active_instances.scalars().all()) >= challenge.max_instances:
            raise ValidationError("Maximum number of instances for this challenge reached")
        
        # Create instance record
        expires_at = datetime.utcnow() + timedelta(seconds=challenge.instance_timeout)
        new_instance = Instance(
            user_id=current_user.id,
            challenge_id=instance_data.challenge_id,
            expires_at=expires_at
        )
        
        db.add(new_instance)
        await db.commit()
        await db.refresh(new_instance)
        
        # Deploy Docker container
        try:
            docker_service = DockerService()
            container_info = await docker_service.deploy_challenge(
                challenge_id=challenge.id,
                instance_id=new_instance.id,
                user_id=current_user.id
            )
            
            # Update instance with container info
            new_instance.container_id = container_info.get("id")
            new_instance.container_name = container_info.get("name")
            new_instance.container_ip = container_info.get("ip")
            new_instance.container_ports = container_info.get("ports")
            new_instance.instance_url = container_info.get("url")
            new_instance.status = InstanceStatus.RUNNING
            
            await db.commit()
            
        except Exception as e:
            new_instance.status = InstanceStatus.ERROR
            new_instance.error_message = str(e)
            await db.commit()
            raise InstanceError(f"Failed to deploy challenge: {e}")
        
        return InstanceResponse(
            id=new_instance.id,
            challenge_id=new_instance.challenge_id,
            challenge_title=challenge.title,
            status=new_instance.status,
            instance_url=new_instance.instance_url,
            started_at=new_instance.started_at.isoformat(),
            expires_at=new_instance.expires_at.isoformat(),
            time_remaining=new_instance.time_remaining,
            duration_minutes=new_instance.duration_minutes
        )
        
    except (NotFoundError, ValidationError, InstanceError):
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create instance"
        )


@router.delete("/{instance_id}")
async def stop_instance(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop challenge instance"""
    try:
        # Get instance
        instance = await db.get(Instance, instance_id)
        if not instance:
            raise NotFoundError("Instance not found")
        
        if instance.user_id != current_user.id:
            raise ValidationError("Access denied")
        
        if instance.status not in [InstanceStatus.RUNNING, InstanceStatus.STARTING]:
            raise ValidationError("Instance is not running")
        
        # Stop Docker container
        if instance.container_id:
            try:
                docker_service = DockerService()
                await docker_service.stop_container(instance.container_id)
            except Exception as e:
                # Log error but don't fail the request
                pass
        
        # Update instance status
        instance.status = InstanceStatus.STOPPED
        instance.stopped_at = datetime.utcnow()
        
        await db.commit()
        
        return {"message": "Instance stopped successfully"}
        
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop instance"
        )


@router.get("/{instance_id}", response_model=InstanceResponse)
async def get_instance(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get instance details"""
    try:
        instance = await db.get(Instance, instance_id)
        if not instance:
            raise NotFoundError("Instance not found")
        
        if instance.user_id != current_user.id:
            raise ValidationError("Access denied")
        
        # Get challenge
        challenge = await db.get(Challenge, instance.challenge_id)
        
        return InstanceResponse(
            id=instance.id,
            challenge_id=instance.challenge_id,
            challenge_title=challenge.title if challenge else "Unknown",
            status=instance.status,
            instance_url=instance.instance_url,
            started_at=instance.started_at.isoformat(),
            expires_at=instance.expires_at.isoformat(),
            time_remaining=instance.time_remaining,
            duration_minutes=instance.duration_minutes
        )
        
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get instance"
        )
