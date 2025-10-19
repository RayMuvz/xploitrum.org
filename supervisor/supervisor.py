# supervisor/supervisor.py
# A small Flask app to spawn ephemeral docker containers for teams on request.
# Inline comments explain design and safety checks.

import os
import time
import uuid
import yaml
import signal
from flask import Flask, request, jsonify
import docker
from threading import Thread

app = Flask(__name__)
client = docker.from_env()
BASE_DIR = os.path.dirname(__file__)
config = {}
try:
    with open(os.path.join(BASE_DIR, "supervisor_config.yml")) as f:
        config = yaml.safe_load(f)
except Exception:
    config = {}

SUPERVISOR_SECRET = os.environ.get("SUPERVISOR_SECRET", "supersecretreplace")
EXPIRY = config.get("expiry", 3600)
CHALLENGES = config.get("challenges", {})

# Simple in-memory registry of active sandboxes (persist to disk in production)
active = {}

def schedule_destroy(container_id, ttl):
    def destroy():
        time.sleep(ttl)
        try:
            c = client.containers.get(container_id)
            c.remove(force=True)
            active.pop(container_id, None)
            app.logger.info(f"Destroyed container {container_id}")
        except Exception as e:
            app.logger.error(f"Error destroying {container_id}: {e}")
    Thread(target=destroy, daemon=True).start()

@app.route("/spawn", methods=["POST"])
def spawn():
    # Authentication via header secret
    auth = request.headers.get("X-SUPERVISOR-AUTH")
    if auth != SUPERVISOR_SECRET:
        return jsonify({"status":"error","message":"unauthorized"}), 403

    data = request.json or {}
    team_id = data.get("team_id", "anon")
    challenge_key = data.get("challenge_key")
    if not challenge_key:
        return jsonify({"status":"error","message":"missing challenge_key"}), 400

    # Basic denylist check
    if any(bad in challenge_key for bad in config.get("denylist", [])):
        return jsonify({"status":"error","message":"denied"}), 400

    # Lookup challenge template
    ch = CHALLENGES.get(challenge_key)
    if not ch:
        return jsonify({"status":"error","message":"unknown challenge"}), 404

    # Build unique name for container
    name = f"sandbox-{challenge_key}-{team_id}-{uuid.uuid4().hex[:8]}"

    # Create container with resource limits, user namespace, no privileged
    try:
        container = client.containers.run(
            image=ch["image"],
            name=name,
            detach=True,
            network=config.get("docker_network","bridge"),
            ports={f'{ch["internal_port"]}/tcp': None},  # map to random host port
            mem_limit=ch.get("mem_limit","512m"),
            nano_cpus=int(ch.get("cpus",0.5)*1e9) if ch.get("cpus") else None,
            security_opt=["no-new-privileges"],
            read_only=False,
            labels={"xploitrum_sandbox":"true", "challenge":challenge_key, "team":str(team_id)}
        )
        # Inspect mapped port
        container.reload()
        port_binding = None
        if container.attrs.get("NetworkSettings", {}).get("Ports"):
            ports = container.attrs["NetworkSettings"]["Ports"]
            # get first bound port host:port
            for internal, hostlist in ports.items():
                if hostlist:
                    port_binding = hostlist[0]["HostPort"]
                    break

        active[container.id] = {
            "id": container.id,
            "name": name,
            "challenge": challenge_key,
            "team": team_id,
            "host_port": port_binding,
            "created": time.time()
        }
        # Schedule auto-destroy
        schedule_destroy(container.id, EXPIRY)
        return jsonify({"status":"ok","container_id":container.id, "host_port": port_binding}), 201
    except docker.errors.APIError as e:
        return jsonify({"status":"error","message":str(e)}), 500

@app.route("/list", methods=["GET"])
def list_active():
    return jsonify(active)

@app.route("/destroy", methods=["POST"])
def destroy():
    auth = request.headers.get("X-SUPERVISOR-AUTH")
    if auth != SUPERVISOR_SECRET:
        return jsonify({"status":"error","message":"unauthorized"}), 403
    cid = request.json.get("container_id")
    if not cid:
        return jsonify({"status":"error","message":"missing container_id"}), 400
    try:
        c = client.containers.get(cid)
        c.remove(force=True)
        active.pop(cid, None)
        return jsonify({"status":"ok"}), 200
    except Exception as e:
        return jsonify({"status":"error","message":str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
