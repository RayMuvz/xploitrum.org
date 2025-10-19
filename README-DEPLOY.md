# README-DEPLOY.md — Exact commands to deploy to 159.65.248.234

## 1) Create Droplet (manual)
- Ubuntu 22.04 LTS
- 4 vCPU / 8GB RAM recommended for event
- 100 GB disk
- Add your SSH public key during droplet creation

Replace the IP below with 159.65.248.234

## 2) DNS records (example)
Create A records pointing to 159.65.248.234:
- xploitrum.org -> 159.65.248.234
- ctf.xploitrum.org -> 159.65.248.234
- api.xploitrum.org -> 159.65.248.234
- vpn.xploitrum.org -> 159.65.248.234

## 3) Bootstrap (one-line)
On your local machine:
- ssh root@159.65.248.234 'bash -s' < <(curl -sSL https://raw.githubusercontent.com/YOUR-USERNAME/xploitrum-ctf/main/deploy/bootstrap.sh)

## 4) Validate basics
- Check containers: `ssh root@159.65.248.234 docker compose -f /opt/xploitrum-ctf/infra/docker-compose.yml ps`
- Validate Traefik: `curl -k https://ctf.xploitrum.org/` should return CTFd HTML (may 302 to login)
- VPN clients: scp or download `/opt/xploitrum-ctf/deploy/vpn/clients/*.ovpn` to client machines and test.

## 5) Admin login
- Admin seeded in bootstrap: see bootstrap output (default admin email/password). Change immediately after first login.

## 6) Day-of quick runbook (short)
1. `docker compose -f /opt/xploitrum-ctf/infra/docker-compose.yml up -d`
2. Check logs: `docker compose -f /opt/xploitrum-ctf/infra/docker-compose.yml logs -f ctfd`
3. Validate sample team: register test team, trigger challenge to spawn sandbox using CTFd admin action or `ctfd` plugin endpoint.
4. Collect logs: `docker logs <container>` and `docker inspect` as needed.
