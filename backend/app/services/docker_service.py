"""
XploitRUM CTF Platform - Docker Service
"""

import docker
import json
import random
import string
from typing import Dict, Any, Optional
from loguru import logger
from app.core.config import settings
from app.core.exceptions import DockerError


class DockerService:
    """Service for managing Docker containers for challenges"""
    
    def __init__(self):
        try:
            self.client = docker.from_env()
            self.network_name = settings.CHALLENGE_NETWORK
            self._ensure_network_exists()
            self.is_available = True
            logger.info("Docker client initialized successfully")
        except Exception as e:
            logger.warning(f"Docker client not available: {e}")
            logger.warning("CTF challenge instances will not be available without Docker")
            self.client = None
            self.network_name = None
            self.is_available = False
    
    def _ensure_network_exists(self):
        """Ensure the challenge network exists"""
        if not self.client:
            return
        try:
            networks = self.client.networks.list(names=[self.network_name])
            if not networks:
                self.client.networks.create(
                    name=self.network_name,
                    driver="bridge",
                    ipam=docker.types.IPAMConfig(
                        pool_configs=[
                            docker.types.IPAMPool(subnet=settings.CHALLENGE_SUBNET)
                        ]
                    )
                )
                logger.info(f"Created Docker network: {self.network_name}")
        except Exception as e:
            logger.error(f"Failed to create network: {e}")
            raise DockerError("Failed to create challenge network")
    
    async def deploy_challenge(
        self,
        challenge_id: int,
        instance_id: int,
        user_id: int,
        docker_image: Optional[str] = None,
        docker_compose_file: Optional[str] = None,
        environment: Optional[Dict[str, str]] = None,
        ports: Optional[Dict[str, str]] = None,
        volumes: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Deploy a challenge container"""
        if not self.is_available:
            raise DockerError("Docker is not available. Please ensure Docker is running.")
        try:
            # Generate unique container name
            container_name = f"challenge-{challenge_id}-{instance_id}-{user_id}"
            
            # Prepare container configuration
            container_config = {
                "image": docker_image or f"xploitrum/challenge-{challenge_id}",
                "name": container_name,
                "network": self.network_name,
                "detach": True,
                "remove": False,
                "environment": environment or {},
                "labels": {
                    "challenge_id": str(challenge_id),
                    "instance_id": str(instance_id),
                    "user_id": str(user_id),
                    "managed_by": "xploitrum"
                }
            }
            
            # Add port mappings
            if ports:
                container_config["ports"] = ports
            
            # Add volume mappings
            if volumes:
                container_config["volumes"] = volumes
            
            # Create and start container
            container = self.client.containers.run(**container_config)
            
            # Get container information
            container.reload()
            
            # Get container IP
            container_ip = None
            if container.attrs.get("NetworkSettings", {}).get("Networks", {}).get(self.network_name):
                container_ip = container.attrs["NetworkSettings"]["Networks"][self.network_name]["IPAddress"]
            
            # Generate access URL
            instance_url = None
            if container_ip and ports:
                # Use first mapped port for access URL
                first_port = list(ports.keys())[0]
                instance_url = f"http://{container_ip}:{first_port}"
            
            logger.info(f"Deployed challenge container: {container.id}")
            
            return {
                "id": container.id,
                "name": container.name,
                "ip": container_ip,
                "url": instance_url,
                "ports": container.attrs.get("NetworkSettings", {}).get("Ports", {}),
                "status": container.status
            }
            
        except Exception as e:
            logger.error(f"Failed to deploy challenge: {e}")
            raise DockerError(f"Failed to deploy challenge: {e}")
    
    async def stop_container(self, container_id: str) -> bool:
        """Stop and remove a container"""
        try:
            container = self.client.containers.get(container_id)
            
            # Stop container
            container.stop(timeout=10)
            
            # Remove container
            container.remove(force=True)
            
            logger.info(f"Stopped and removed container: {container_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop container {container_id}: {e}")
            raise DockerError(f"Failed to stop container: {e}")
    
    async def get_container_status(self, container_id: str) -> Dict[str, Any]:
        """Get container status and information"""
        try:
            container = self.client.containers.get(container_id)
            container.reload()
            
            return {
                "id": container.id,
                "name": container.name,
                "status": container.status,
                "created": container.attrs.get("Created"),
                "image": container.attrs.get("Config", {}).get("Image"),
                "ports": container.attrs.get("NetworkSettings", {}).get("Ports", {}),
                "labels": container.attrs.get("Config", {}).get("Labels", {})
            }
            
        except Exception as e:
            logger.error(f"Failed to get container status {container_id}: {e}")
            raise DockerError(f"Failed to get container status: {e}")
    
    async def list_user_containers(self, user_id: int) -> list:
        """List containers for a specific user"""
        try:
            containers = self.client.containers.list(
                all=True,
                filters={"label": f"user_id={user_id}"}
            )
            
            return [
                {
                    "id": container.id,
                    "name": container.name,
                    "status": container.status,
                    "created": container.attrs.get("Created"),
                    "image": container.attrs.get("Config", {}).get("Image"),
                    "labels": container.attrs.get("Config", {}).get("Labels", {})
                }
                for container in containers
            ]
            
        except Exception as e:
            logger.error(f"Failed to list user containers: {e}")
            raise DockerError(f"Failed to list user containers: {e}")
    
    async def cleanup_expired_containers(self) -> int:
        """Cleanup expired containers"""
        try:
            # Get all challenge containers
            containers = self.client.containers.list(
                all=True,
                filters={"label": "managed_by=xploitrum"}
            )
            
            cleaned_count = 0
            for container in containers:
                try:
                    # Check if container is expired (this would need additional logic)
                    # For now, just remove stopped containers
                    if container.status == "exited":
                        container.remove(force=True)
                        cleaned_count += 1
                except Exception as e:
                    logger.error(f"Failed to cleanup container {container.id}: {e}")
            
            logger.info(f"Cleaned up {cleaned_count} expired containers")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup containers: {e}")
            raise DockerError(f"Failed to cleanup containers: {e}")
    
    async def get_container_logs(self, container_id: str, tail: int = 100) -> str:
        """Get container logs"""
        try:
            container = self.client.containers.get(container_id)
            logs = container.logs(tail=tail, timestamps=True)
            return logs.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Failed to get container logs {container_id}: {e}")
            raise DockerError(f"Failed to get container logs: {e}")
    
    async def get_container_metrics(self, container_id: str) -> Dict[str, Any]:
        """Get container resource usage metrics"""
        try:
            container = self.client.containers.get(container_id)
            stats = container.stats(stream=False)
            
            # Calculate CPU usage percentage
            cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
            system_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
            cpu_percent = (cpu_delta / system_delta) * len(stats['cpu_stats']['cpu_usage']['percpu_usage']) * 100.0
            
            # Calculate memory usage
            memory_usage = stats['memory_stats']['usage']
            memory_limit = stats['memory_stats']['limit']
            memory_percent = (memory_usage / memory_limit) * 100.0
            
            return {
                "cpu_percent": round(cpu_percent, 2),
                "memory_usage": memory_usage,
                "memory_limit": memory_limit,
                "memory_percent": round(memory_percent, 2),
                "network_rx": stats['networks'].get('eth0', {}).get('rx_bytes', 0),
                "network_tx": stats['networks'].get('eth0', {}).get('tx_bytes', 0)
            }
            
        except Exception as e:
            logger.error(f"Failed to get container metrics {container_id}: {e}")
            raise DockerError(f"Failed to get container metrics: {e}")
