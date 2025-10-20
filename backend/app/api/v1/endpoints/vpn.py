"""
XploitRUM CTF Platform - VPN Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from typing import Optional
import os
import tempfile

from app.core.database import get_db
from app.services.auth_service import get_current_user_optional
from app.models.user import User

router = APIRouter()

@router.get("/download")
async def download_openvpn_config(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Download OpenVPN configuration file
    For now, returns a sample config. In production, this would generate user-specific configs.
    """
    
    # Sample OpenVPN configuration
    ovpn_config = """# XploitRUM CTF Platform OpenVPN Configuration
client
dev tun
proto udp
remote vpn.xploitrum.org 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
verb 3

# NOTE: This is a sample configuration for development
# In production, this would include:
# - User-specific certificates
# - CA certificate
# - Client certificate
# - Client key
# Generated dynamically per user

# For now, connect to your local network or use the target IPs directly
# Example: ping 172.20.0.X (where X is the IP shown in your instance)
"""

    # Return configuration directly as response
    return Response(
        content=ovpn_config,
        media_type="application/x-openvpn-profile",
        headers={
            "Content-Disposition": "attachment; filename=xploitrum.ovpn"
        }
    )

@router.get("/status")
async def get_vpn_status(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get VPN connection status"""
    return {
        "vpn_enabled": True,
        "server": "vpn.xploitrum.org:1194",
        "protocol": "udp",
        "note": "For development, you can access instances directly via their IP addresses shown in the instances tab"
    }

