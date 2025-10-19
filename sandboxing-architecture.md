# Sandboxing architecture (summary)

This system uses Docker containers as ephemeral sandboxes per-team or per-attempt. A supervisor service (Python + Docker SDK) receives requests from the CTF backend (CTFd plugin) and instantiates containers from prebuilt challenge images (e.g., xploitrum/web-easy). Each container runs with strict resource caps (default: 512 MB RAM, 0.5 CPU, pids limit) and `no-new-privileges` enabled. Containers map the challenge internal port to a randomized host port, which the supervisor returns to the backend for display to players.

Limitations on a single VPS: mounting the Docker socket (required for container lifecycle control) grants high privileges to the supervisor process and can be used as an escalation vector; kernel-level escapes from container namespaces are possible. To mitigate:
- Denylist images/commands, use unprivileged containers, restrict supervisor access with a secret header.
- Run the supervisor in a separate, minimal account and use a dedicated Docker network.
- For production hardened isolation, move sandboxes to separate hosts (worker fleet), VMs, or microVMs (Firecracker) and use network segmentation (VLANs) and host-based filtering.

Supervisor safety checks include simple denylisting and startup timeouts; it also auto-destroys containers after expiry. For a production upgrade path, deploy worker nodes (one per challenge class) and orchestrate via an API (supervisor → worker), or use orchestration like Nomad with Firecracker to minimize host exposure.
