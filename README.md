# Xploit RUM — CTF Platform (production-ready scaffold)

This repository contains a production-focused Capture-The-Flag platform scaffold:
- Public React frontend (`/frontend`)
- CTFd backend with a thin plugin to call a sandbox supervisor (`/backend/ctfd-plugin-supervisor`)
- Supervisor that spawns ephemeral Docker sandboxes (`/supervisor`)
- Three sample web challenges under `/challenges`
- Traefik-based reverse proxy with ACME and docker-compose orchestration (`/infra`)
- OpenVPN configuration scripts under `/deploy/vpn`
- Bootstrap and deploy scripts under `/deploy`

## Quick start (developer)
1. Copy `infra/.env.example` -> `infra/.env` and set domain values.
2. Build & run: `cd infra && docker compose up -d`
3. Build challenges: `for d in ../challenges/*; do docker build -t xploitrum/$(basename $d):latest $d; done`
4. Start supervisor: `docker compose up -d supervisor`
5. Seed admin: `python3 deploy/seed_admin.py --email admin@xploitrum.org --password Pass1234`

See `README-DEPLOY.md` for exact droplet deployment steps and day-of runbook.

Security constraints enforced:
- No privileged containers; `security_opt: ["no-new-privileges"]`.
- Default sandbox caps: mem=512m, cpus=0.5, pids limit=100 (see supervisor_config.yml).
- Supervisor uses a shared Docker socket — **this is a security tradeoff**. For production, migrate sandboxes to separate worker hosts or microVMs.
- The supervisor validates `X-SUPERVISOR-AUTH` header on all operations.
