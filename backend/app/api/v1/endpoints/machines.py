"""
XploitRUM - Machines API Endpoints (HTB-style)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.core.database import get_db
from app.services.auth_service import get_current_admin_user, get_current_user_optional
from app.models.user import User
from app.models.machine import Machine, MachineInstance, MachineOS, MachineDifficulty, MachineStatus
from app.services.docker_service import DockerService

router = APIRouter()


class MachineResponse(BaseModel):
    id: int
    name: str
    description: str
    os: str
    difficulty: str
    ip_address: str
    status: str
    points: int
    user_owns: bool = False
    
    class Config:
        from_attributes = True


class MachineCreate(BaseModel):
    name: str
    description: str
    os: str
    difficulty: str
    points: int
    docker_image: str
    flag: str


class MachineUpdate(BaseModel):
    status: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None


class ActiveMachineResponse(BaseModel):
    id: int
    machine_id: int
    machine_name: str
    ip_address: str
    started_at: str
    expires_at: str
    time_remaining: int


@router.get("", response_model=List[MachineResponse])
async def get_machines(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get all active machines"""
    machines = db.query(Machine).filter(Machine.status == MachineStatus.ACTIVE).all()
    
    return [
        MachineResponse(
            id=m.id,
            name=m.name,
            description=m.description,
            os=m.os.value,
            difficulty=m.difficulty.value,
            ip_address=m.base_ip_address,
            status=m.status.value,
            points=m.points,
            user_owns=False  # TODO: Check if user owns this machine
        )
        for m in machines
    ]


@router.get("/active", response_model=Optional[ActiveMachineResponse])
async def get_active_machine(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get user's active machine"""
    # For now, get any active instance (we'll add user filtering later)
    instance = db.query(MachineInstance).filter(
        MachineInstance.status == "running"
    ).order_by(MachineInstance.started_at.desc()).first()
    
    if not instance:
        return None
    
    machine = db.query(Machine).filter(Machine.id == instance.machine_id).first()
    
    if not machine:
        return None
    
    return ActiveMachineResponse(
        id=instance.id,
        machine_id=instance.machine_id,
        machine_name=machine.name,
        ip_address=instance.ip_address,
        started_at=instance.started_at.isoformat(),
        expires_at=instance.expires_at.isoformat(),
        time_remaining=instance.time_remaining
    )


@router.post("/{machine_id}/start")
async def start_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Start a machine instance"""
    # Check if user already has an active machine
    existing_instance = db.query(MachineInstance).filter(
        MachineInstance.status == "running"
    ).first()
    
    if existing_instance:
        existing_machine = db.query(Machine).filter(Machine.id == existing_instance.machine_id).first()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have '{existing_machine.name}' running. Stop it first."
        )
    
    # Get machine
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    
    if machine.status != MachineStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Machine is not active")
    
    # Deploy Docker container
    docker_service = DockerService()
    
    if not docker_service.is_available:
        # Simulation mode
        import random
        instance_ip = f"10.10.10.{random.randint(10, 250)}"
        
        instance = MachineInstance(
            machine_id=machine.id,
            user_id=current_user.id if current_user else None,
            ip_address=instance_ip,
            status="running",
            started_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=2)
        )
        
        db.add(instance)
        db.commit()
        db.refresh(instance)
        
        return {
            "id": instance.id,
            "machine_id": machine.id,
            "machine_name": machine.name,
            "ip_address": instance_ip,
            "started_at": instance.started_at.isoformat(),
            "expires_at": instance.expires_at.isoformat(),
            "message": "Machine started successfully (simulation mode)"
        }
    
    # Real Docker deployment
    try:
        container_info = await docker_service.deploy_challenge(
            challenge_id=machine.id,
            instance_id=0,  # Will be updated
            user_id=current_user.id if current_user else 0,
            docker_image=machine.docker_image,
            ports={"80/tcp": None} if "web" in machine.description.lower() else {}
        )
        
        # Assign IP from container or use static
        instance_ip = container_info.get("ip", machine.base_ip_address)
        
        # Create instance record
        instance = MachineInstance(
            machine_id=machine.id,
            user_id=current_user.id if current_user else None,
            container_id=container_info.get("id"),
            container_name=container_info.get("name"),
            ip_address=instance_ip,
            status="running",
            started_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=2)
        )
        
        db.add(instance)
        db.commit()
        db.refresh(instance)
        
        return {
            "id": instance.id,
            "machine_id": machine.id,
            "machine_name": machine.name,
            "ip_address": instance_ip,
            "started_at": instance.started_at.isoformat(),
            "expires_at": instance.expires_at.isoformat(),
            "container_url": container_info.get("url"),
            "message": "Machine started successfully"
        }
        
    except Exception as e:
        print(f"Error deploying machine: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start machine: {str(e)}"
        )


@router.post("/{instance_id}/stop")
async def stop_machine(
    instance_id: int,
    db: Session = Depends(get_db)
):
    """Stop a machine instance"""
    instance = db.query(MachineInstance).filter(MachineInstance.id == instance_id).first()
    
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")
    
    # Stop Docker container if exists
    if instance.container_id:
        docker_service = DockerService()
        if docker_service.is_available:
            try:
                await docker_service.stop_container(instance.container_id)
            except Exception as e:
                print(f"Error stopping container: {e}")
    
    # Update instance
    instance.status = "stopped"
    instance.stopped_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Machine stopped successfully"}


# Admin endpoints
@router.post("", response_model=MachineResponse)
async def create_machine(
    machine_data: MachineCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new machine (admin only)"""
    # Check if machine name already exists
    existing = db.query(Machine).filter(Machine.name == machine_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Machine with this name already exists"
        )
    
    # Store flag (encrypt if function available)
    try:
        from app.core.security import encrypt_flag
        encrypted_flag = encrypt_flag(machine_data.flag)
    except:
        # If encryption not available, store as-is for now
        encrypted_flag = machine_data.flag
    
    # Create machine
    machine = Machine(
        name=machine_data.name,
        description=machine_data.description,
        os=MachineOS(machine_data.os),
        difficulty=MachineDifficulty(machine_data.difficulty),
        points=machine_data.points,
        docker_image=machine_data.docker_image,
        user_flag=encrypted_flag,
        status=MachineStatus.ACTIVE,
        created_by=current_user.id
    )
    
    db.add(machine)
    db.commit()
    db.refresh(machine)
    
    return MachineResponse(
        id=machine.id,
        name=machine.name,
        description=machine.description,
        os=machine.os.value,
        difficulty=machine.difficulty.value,
        ip_address=machine.base_ip_address,
        status=machine.status.value,
        points=machine.points,
        user_owns=False
    )


@router.patch("/{machine_id}")
async def update_machine(
    machine_id: int,
    machine_data: MachineUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update machine (admin only)"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    
    if machine_data.status:
        machine.status = MachineStatus(machine_data.status)
    if machine_data.name:
        machine.name = machine_data.name
    if machine_data.description:
        machine.description = machine_data.description
    
    db.commit()
    db.refresh(machine)
    
    return {"message": "Machine updated successfully"}


@router.delete("/{machine_id}")
async def delete_machine(
    machine_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete machine (admin only)"""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    
    db.delete(machine)
    db.commit()
    
    return {"message": "Machine deleted successfully"}

