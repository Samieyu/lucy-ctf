# Lucy CTF - Production Deployment Guide

## 1. VPS Provisioning
- Recommended specs: Ubuntu 22.04 LTS, 4 vCPU, 8 GB RAM, 50 GB SSD.
- Install Docker Engine and Docker Compose v2.

## 2. Firewall & Ports
Allow necessary inbound ports:
- `22/tcp` (SSH)
- `80/tcp` (HTTP)
- `443/tcp` (HTTPS)
- Block `5432` (Postgres) and `4000` (Internal API) from external access.

## 3. DNS Configuration
Set up an A record pointing your domain (e.g., `ctf.example.org`) to your server IP.

## 4. Environment Secrets
Copy `.env.example` to `.env` on the host:
```bash
cp .env.example .env
chmod 600 .env
```
Ensure strong random keys:
- `JWT_SECRET=$(openssl rand -hex 32)`
- `JWT_REFRESH_SECRET=$(openssl rand -hex 32)`
- `POSTGRES_PASSWORD=$(openssl rand -hex 24)`

## 5. First Deploy
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
Verify all services report healthy:
```bash
docker compose -f docker-compose.prod.yml ps
```

## 6. Rollback Procedure
If a release causes issues:
```bash
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml up --build -d
```
