# Security & operations checklist

- Change all default passwords and `SUPERVISOR_SECRET` after initial setup.
- Enable UFW with minimal allowed ports: 22 (ssh), 80/443 for web, OpenVPN UDP port as configured.
- Enable fail2ban for SSH and admin endpoints.
- Daily DB backups: `pg_dump` to /backups then push to remote storage.
- rotate Traefik ACME storage backup weekly.
- Rotate OpenVPN keys monthly (scripts provided).
- Incident response: stop supervisor, `docker ps` and `docker inspect` running sandboxes, pull logs `docker logs`, snapshot disk, isolate host from network if container escape suspected.

Security constraints enforced:
- No privileged containers; `security_opt: ["no-new-privileges"]`.
- Default sandbox caps: mem=512m, cpus=0.5, pids limit=100 (see supervisor_config.yml).
- Supervisor uses a shared Docker socket — **this is a security tradeoff**. For production, migrate sandboxes to separate worker hosts or microVMs.
- The supervisor validates `X-SUPERVISOR-AUTH` header on all operations.
