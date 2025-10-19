# ctfd-plugin-supervisor/plugin.py
"""
Thin CTFd plugin to call the supervisor when a team begins a challenge.
Install by mounting this folder to /var/www/CTFd/CTFd/plugins/supervisor
"""

from CTFd.plugins import register_plugin_assets_directory
from CTFd import utils
from flask import Blueprint, request, current_app
import requests
import os

supervisor_bp = Blueprint("supervisor_plugin", __name__, template_folder="templates")

def load(app):
    # Called when plugin loads
    register_plugin_assets_directory(app, base_path='/var/www/CTFd/CTFd/plugins/supervisor/assets')
    app.register_blueprint(supervisor_bp)

@supervisor_bp.route("/api/v1/supervisor/trigger", methods=["POST"])
def supervisor_trigger():
    """
    Simple API endpoint to trigger supervisor for a team/challenge.
    Expects JSON:
    {
      "team_id": 1,
      "challenge_id": 2,
      "challenge_key": "web-easy"
    }
    """
    data = request.json or {}
    secret = os.environ.get("SUPERVISOR_SECRET", "supersecretreplace")
    # Basic auth via header token
    auth = request.headers.get("X-SUPERVISOR-AUTH")
    if auth != secret:
        return {"status":"error","message":"unauthorized"}, 403

    # Call supervisor service (internal)
    supervisor_url = os.environ.get("SUPERVISOR_URL", "http://supervisor:8000/spawn")
    try:
        r = requests.post(supervisor_url, json=data, timeout=5)
        return r.json(), r.status_code
    except Exception as e:
        return {"status":"error","message": str(e)}, 500
