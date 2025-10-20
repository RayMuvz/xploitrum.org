"""
XploitRUM CTF Platform - API Router
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, challenges, instances, submissions, admin, registration, ctf, events, vpn, contact, stats, machines

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(challenges.router, prefix="/challenges", tags=["challenges"])
api_router.include_router(instances.router, prefix="/instances", tags=["instances"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(registration.router, tags=["registration"])
api_router.include_router(ctf.router, prefix="/ctf", tags=["ctf"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(vpn.router, prefix="/vpn", tags=["vpn"])
api_router.include_router(contact.router, tags=["contact"])
api_router.include_router(stats.router, prefix="/stats", tags=["statistics"])
api_router.include_router(machines.router, prefix="/machines", tags=["machines"])
