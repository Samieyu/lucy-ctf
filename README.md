# Lucy CTF

A self-hosted Capture-The-Flag (CTF) platform. Named after "Dinkinesh" (Lucy), the famous hominid fossil discovered in Ethiopia — a nod to discovery and piecing together hidden fragments, much like solving a CTF challenge.

## Stack

- **Frontend:** Next.js (App Router, React 19, TypeScript, Tailwind CSS)
- **Backend:** NestJS (Node.js, TypeScript, Throttler, Helmet)
- **Database & ORM:** PostgreSQL + Prisma 6
- **Auth:** JWT (15-min access token, 7-day refresh token, bcrypt flag/password hashing, httpOnly cookies)
- **Containerization:** Docker & Docker Compose (dev and multi-stage prod)

---

## Getting Started (Local Development)

### 1. Configure Environment
Copy the example environment file and fill in your secrets:
```powershell
cp .env.example .env
```

### 2. Start with Docker Compose
Start the database, backend, and frontend containers:
```powershell
docker compose up --build
```

### 3. Services Overview
- **Frontend Web UI:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:4000](http://localhost:4000)
- **PostgreSQL Database:** `localhost:5432`

---

## Database Migrations & Seeding

### Run Migrations
Run Prisma migrations inside the running API container:
```powershell
docker compose exec api npx prisma migrate dev
```

### Seed Challenges
Populate the database with sample challenges (Web, Crypto, Forensics, Reverse Engineering):
```powershell
docker compose exec api npm run seed
```

---

## Making a User an Admin

Admins can access `/admin/challenges` to create, modify, activate/deactivate, and delete challenges.

### Option A: Via Docker Exec (Prisma script)
Run the following PowerShell command (replacing `TARGET_USERNAME` with the username you registered):
```powershell
docker compose exec api npx ts-node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.update({ where: { username: 'TARGET_USERNAME' }, data: { isAdmin: true } }).then(u => console.log('Admin enabled for', u.username)).finally(() => prisma.\$disconnect());"
```

### Option B: Direct SQL Query
Connect to PostgreSQL container and update the flag directly:
```powershell
docker compose exec db psql -U lucyctf -d lucyctf -c "UPDATE users SET \"isAdmin\" = true WHERE username = 'TARGET_USERNAME';"
```

---

## Production Deployment

A production-ready `docker-compose.prod.yml` configuration is provided. It features:
- Multi-stage Docker builds without bind mounts or dev servers
- Next.js standalone output runner
- Automatic execution of `npx prisma migrate deploy` prior to NestJS startup
- Healthchecks on database, API, and frontend containers
- Rate limiting (`@nestjs/throttler`) and security headers (`helmet`)

### Build and Launch Production Stack
```powershell
# Ensure your .env is populated with strong production secrets
docker compose -f docker-compose.prod.yml up --build -d
```

### View Production Logs
```powershell
docker compose -f docker-compose.prod.yml logs -f
```

### Tear Down Production Stack
```powershell
docker compose -f docker-compose.prod.yml down
```

---

## Environment Variables

| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `POSTGRES_USER` | PostgreSQL superuser username | `lucyctf` |
| `POSTGRES_PASSWORD` | PostgreSQL database password | `lucyctf` |
| `POSTGRES_DB` | PostgreSQL database name | `lucyctf` |
| `DATABASE_URL` | Prisma PostgreSQL connection string | `postgresql://lucyctf:lucyctf@db:5432/lucyctf` |
| `PORT` | NestJS backend port | `4000` |
| `JWT_SECRET` | Secret key for 15m access token signing | `change_me_in_env` |
| `JWT_REFRESH_SECRET` | Secret key for 7d refresh token signing | `change_me_in_env_refresh` |
| `FRONTEND_URL` | Allowed CORS origin for browser requests | `http://localhost:3000` |
| `BACKEND_INTERNAL_URL` | Internal URL for Next.js proxy to call NestJS | `http://api:4000` |
| `NEXT_PUBLIC_API_URL` | Public API URL | `http://localhost:4000` |
| `GROQ_API_KEY` | Optional API key for AI hints | `""` |
