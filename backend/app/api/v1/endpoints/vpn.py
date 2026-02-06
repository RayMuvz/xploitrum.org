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
from app.core.auth import get_current_user_optional
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
    
    # OpenVPN configuration for CTF platform
    # NOTE: For now, OpenVPN is not fully configured
    # You can access instances directly via:
    # http://xploitrum.org:PORT (shown in your instance details)
    
    ovpn_config = """# XploitRUM CTF Platform - Direct Access Configuration
# 
# ⚠️  OpenVPN Server Not Yet Configured
#
# TO ACCESS YOUR INSTANCES:
# 1. Go to "My Instances" tab
# 2. Click "Access Machine"
# 3. Use the web browser interface (no VPN needed!)
#
# Each instance has a direct URL like:
# http://xploitrum.org:10XXX
#
# You can also use the IP address shown in instance details:
# http://172.20.0.X:80
#
# ═══════════════════════════════════════════════════════
# OpenVPN Setup (For Administrators)
# ═══════════════════════════════════════════════════════
#
# To set up OpenVPN server:
# 1. Install OpenVPN: sudo apt install openvpn easy-rsa
# 2. Configure PKI and generate certificates
# 3. Update this endpoint to include:
#    - CA certificate
#    - Client certificate  
#    - Client key
#
# For now, direct HTTP access works perfectly for web challenges!
#
# Questions? Check the DOCKER_SETUP.md documentation.
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

