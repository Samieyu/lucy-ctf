# Lucy CTF — Backend Core (NestJS 11 + Prisma 6)

The Lucy CTF backend is a modular, high-throughput REST API and Server-Sent Events (SSE) server built on **NestJS 11**, **Prisma 6**, and **PostgreSQL 16**.

---

## 🏗️ Architecture & Modules

The application is structured into domain-driven modules inside `src/`:

```
src/
├── admin/          # Platform administration: user roles, bans, team score resets, audit logs
├── attachments/    # Authenticated challenge file attachments with SHA256 checksums
├── auth/           # JWT access/refresh token rotation, TOTP 2FA, password reset
├── challenges/     # Challenge CRUD, dynamic CTFd parabolic scoring decay
├── event/          # Competition window (startsAt, endsAt), scoreboard freeze, pause toggle
├── groq/           # Groq AI assistant (Llama 3.3) with regex flag redaction & usage limits
├── health/         # Kubernetes/Docker probes (/health, /ready) and Prometheus (/metrics)
├── hints/          # Costed hints with atomic team score deduction
├── instances/      # Dynamic ephemeral container instances via Docker socket proxy
├── leaderboard/    # Live rankings and frozen scoreboard snapshots
├── mail/           # SMTP email dispatch with console dev fallback
├── prisma/         # Global PrismaService client provider
├── realtime/       # Server-Sent Events (SSE) stream (/events/stream)
├── submissions/    # Atomic flag submission, tie-breaking, first blood bonuses
├── teams/          # Team formation, max capacity 4, captain succession
└── writeups/       # Solved challenge solution writeups in Markdown
```

---

## 🔒 Security Principles

1. **Zero-Leak Policy**: Challenge flags and flag hashes (`flagHash`) are never exposed across any public endpoint or log.
2. **Atomic Transactions**: Flag submissions, score increments, hint purchases, and first blood awards run inside Prisma `$transaction` blocks to prevent race conditions.
3. **Session Invalidation**: Refresh token family tracking revokes all issued tokens if an already-rotated token is submitted (token theft detection).
4. **Rate Limiting**: Global throttle (100 req/min) with tighter gates on authentication (10 req/min) and flag submissions (10 req/min per user).
5. **Security Headers**: Standardized with Helmet (`X-Frame-Options`, `Content-Security-Policy`, `HSTS`).

---

## 🧪 Testing

```powershell
# Run Jest unit test suite:
npm test

# Run tests in watch mode:
npm run test:watch

# Run test coverage analysis:
npm run test:cov
```

---

## 🛠️ Database Commands (Prisma 6)

```powershell
# Generate Prisma Client:
npx prisma generate

# Create & apply new migration:
npx prisma migrate dev --name <migration_name>

# Apply pending migrations in production:
npx prisma migrate deploy

# Seed initial event settings, admin user, and sample challenges:
npm run seed
```
