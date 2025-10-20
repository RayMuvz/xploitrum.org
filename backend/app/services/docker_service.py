"""
XploitRUM CTF Platform - Docker Service
"""

import docker
import json
import random
import string
import time
import socket
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
        """Deploy a challenge container with enhanced functionality"""
        if not self.is_available:
            raise DockerError("Docker is not available. Please ensure Docker is running.")
        try:
            # Generate unique container name
            container_name = f"challenge-{challenge_id}-{instance_id}-{user_id}"
            
            # Find available ports dynamically
            host_ports = self._find_available_ports(ports or {"80/tcp": None})
            
            # Prepare container configuration
            container_config = {
                "image": docker_image or f"xploitrum/challenge-{challenge_id}",
                "name": container_name,
                "network": self.network_name,
                "detach": True,
                "remove": False,
                "environment": environment or {},
                "ports": host_ports,
                "labels": {
                    "challenge_id": str(challenge_id),
                    "instance_id": str(instance_id),
                    "user_id": str(user_id),
                    "managed_by": "xploitrum",
                    "challenge_type": "ctf"
                },
                "restart_policy": {"Name": "unless-stopped"},
                "mem_limit": "1g",  # Limit memory usage
                "cpu_period": 100000,
                "cpu_quota": 50000  # Limit CPU usage to 50%
            }
            
            # Add volume mappings
            if volumes:
                container_config["volumes"] = volumes
            
            # Create and start container
            container = self.client.containers.run(**container_config)
            
            # Wait for container to be ready
            await self._wait_for_container_ready(container, timeout=60)
            
            # Get container information
            container.reload()
            
            # Get container IP
            container_ip = None
            if container.attrs.get("NetworkSettings", {}).get("Networks", {}).get(self.network_name):
                container_ip = container.attrs["NetworkSettings"]["Networks"][self.network_name]["IPAddress"]
            
            # Generate access URLs (both direct and VPN)
            access_urls = self._generate_access_urls(container_ip, host_ports)
            
            logger.info(f"Deployed challenge container: {container.id}")
            logger.info(f"Container IP: {container_ip}")
            logger.info(f"Access URLs: {access_urls}")
            
            return {
                "id": container.id,
                "name": container.name,
                "ip": container_ip,
                "url": access_urls.get("direct"),
                "vpn_url": access_urls.get("vpn"),
                "ports": container.attrs.get("NetworkSettings", {}).get("Ports", {}),
                "host_ports": host_ports,
                "status": container.status,
                "access_urls": access_urls
            }
            
        except Exception as e:
            logger.error(f"Failed to deploy challenge: {e}")
            raise DockerError(f"Failed to deploy challenge: {e}")
    
    def _find_available_ports(self, port_mapping: Dict[str, str]) -> Dict[str, str]:
        """Find available host ports for container port mapping"""
        available_ports = {}
        start_port = 10000  # Start from port 10000
        
        for container_port in port_mapping.keys():
            for port in range(start_port, 65535):
                try:
                    # Check if port is available
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.bind(('', port))
                        available_ports[container_port] = str(port)
                        start_port = port + 1
                        break
                except OSError:
                    continue
        
        return available_ports
    
    async def _wait_for_container_ready(self, container, timeout: int = 60):
        """Wait for container to be ready and healthy"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            container.reload()
            if container.status == "running":
                # Check if container is healthy (basic check)
                try:
                    # For web applications, try to connect to port 80
                    if "80/tcp" in [port.split("/")[0] + "/" + port.split("/")[1] for port in container.attrs.get("NetworkSettings", {}).get("Ports", {}).keys()]:
                        # Simple health check - could be enhanced
                        return True
                except:
                    pass
                return True
            time.sleep(2)
        
        raise DockerError(f"Container {container.id} failed to become ready within {timeout} seconds")
    
    def _generate_access_urls(self, container_ip: str, host_ports: Dict[str, str]) -> Dict[str, str]:
        """Generate access URLs for both direct and VPN access"""
        urls = {}
        
        # Direct access via host ports (use droplet IP or xploitrum.org)
        if host_ports:
            for container_port, host_port in host_ports.items():
                port = container_port.split("/")[0]
                # Use the main domain for direct access
                # The nginx proxy should handle forwarding or user accesses directly via IP:PORT
                urls["direct"] = f"http://xploitrum.org:{host_port}"
                urls["direct_ip"] = f"http://[SERVER_IP]:{host_port}"  # Will be replaced
                break  # Use first port for main URL
        
        # VPN access via container IP
        if container_ip and host_ports:
            # Find HTTP port in container
            for container_port in host_ports.keys():
                port = container_port.split("/")[0]
                if port in ["80", "8080", "3000", "8000"]:  # Common web ports
                    urls["vpn"] = f"http://{container_ip}:{port}"
                    break
        
        return urls
    
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
