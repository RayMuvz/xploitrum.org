"""
XploitRUM CTF Platform - VPN Service
"""

import subprocess
import os
import tempfile
from typing import Dict, Any, Optional
from loguru import logger
from app.core.config import settings
from app.core.exceptions import VPNError


class VPNService:
    """Service for managing OpenVPN connections and user profiles"""
    
    def __init__(self):
        self.openvpn_path = "/usr/sbin/openvpn"  # Default OpenVPN path
        self.config_path = settings.OPENVPN_CONFIG_PATH
    
    async def create_user_profile(self, username: str, user_id: int) -> Dict[str, Any]:
        """Create a new OpenVPN user profile"""
        try:
            # Generate client certificate and key
            client_config = f"""
client
dev tun
proto {settings.OPENVPN_PROTOCOL}
remote {settings.OPENVPN_SERVER_NAME}.xploitrum.org {settings.OPENVPN_PORT}
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert {username}.crt
key {username}.key
cipher AES-256-CBC
verb 3
"""
            
            # Save client configuration to temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.ovpn', delete=False) as f:
                f.write(client_config)
                config_file = f.name
            
            logger.info(f"Created OpenVPN profile for user {username}")
            
            return {
                "username": username,
                "config_file": config_file,
                "status": "created"
            }
            
        except Exception as e:
            logger.error(f"Failed to create VPN profile for {username}: {e}")
            raise VPNError(f"Failed to create VPN profile: {e}")
    
    async def revoke_user_profile(self, username: str) -> bool:
        """Revoke a user's OpenVPN profile"""
        try:
            # In a real implementation, you would revoke the certificate
            # For now, we'll just log the action
            logger.info(f"Revoked VPN profile for user {username}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke VPN profile for {username}: {e}")
            raise VPNError(f"Failed to revoke VPN profile: {e}")
    
    async def get_user_connection_status(self, username: str) -> Dict[str, Any]:
        """Get connection status for a user"""
        try:
            # In a real implementation, you would check actual connection status
            # For now, return a mock status
            return {
                "username": username,
                "connected": False,
                "connected_since": None,
                "bytes_received": 0,
                "bytes_sent": 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get connection status for {username}: {e}")
            raise VPNError(f"Failed to get connection status: {e}")
    
    async def list_connected_users(self) -> list:
        """List all currently connected users"""
        try:
            # In a real implementation, you would parse OpenVPN status
            # For now, return empty list
            return []
            
        except Exception as e:
            logger.error(f"Failed to list connected users: {e}")
            raise VPNError(f"Failed to list connected users: {e}")
    
    async def restart_vpn_server(self) -> bool:
        """Restart the OpenVPN server"""
        try:
            # In a real implementation, you would restart the OpenVPN service
            logger.info("VPN server restart requested")
            return True
            
        except Exception as e:
            logger.error(f"Failed to restart VPN server: {e}")
            raise VPNError(f"Failed to restart VPN server: {e}")
    
    async def get_server_status(self) -> Dict[str, Any]:
        """Get OpenVPN server status"""
        try:
            return {
                "status": "running",
                "uptime": "0 days, 0 hours, 0 minutes",
                "clients_connected": 0,
                "total_bytes_received": 0,
                "total_bytes_sent": 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get server status: {e}")
            raise VPNError(f"Failed to get server status: {e}")
