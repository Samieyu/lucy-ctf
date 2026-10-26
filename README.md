<div align="center">

# 🚩 Lucy CTF

### *Production-Grade, Self-Hosted Capture-The-Flag Platform*

[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

*Named after **Dinkinesh** ("Lucy"), the famous 3.2-million-year-old hominid discovered in Ethiopia — a symbol of discovery and piecing together hidden fragments.*

</div>

---

## 🌟 Overview

**Lucy CTF** is a modern, high-performance, and secure Capture-The-Flag platform engineered for cybersecurity competitions, university hacking contests, and corporate red/blue team training. 

Built with **Next.js 16** (React 19 App Router) on the frontend, **NestJS 11** on the backend, and **PostgreSQL 16** managed via **Prisma 6**, Lucy CTF provides an enterprise-ready architecture that isolates participants, prevents cheating, supports dynamic scoring, and delivers real-time competition updates.

---

## ⚡ Key Features

| Domain | Capabilities |
| :--- | :--- |
| **Scoring & Solves** | • **Atomic Scoring**: Prisma transactions prevent double-scoring and race conditions.<br>• **Dynamic Scoring**: Parabolic decay formula based on CTFd specification.<br>• **First Blood**: 20% bonus points awarded to the first team to solve a challenge.<br>• **Team Tie-breaking**: Standardized on earliest `lastScoredAt` timestamp. |
| **Real-Time Engine** | • **Server-Sent Events (SSE)**: Live streaming for challenge solves, first bloods, and announcements.<br>• **Live Notification Toasts**: Instant popups alerting participants to competition events.<br>• **Scoreboard Freeze**: Public leaderboard freezes at designated time while admins view live solves. |
| **AI Hint Assistant** | • **Groq AI Integration**: AI tutor providing nudge hints without leaking solutions.<br>• **Automated Flag Redaction**: Strict post-processing replaces flag patterns with `[redacted]`.<br>• **Usage Throttling**: Strict 5-question limit per user per challenge. |
| **Challenge System** | • **Costed Hints**: Hint text is unlocked by deducting points from team score.<br>• **Secure Attachments**: Authenticated file downloads (25MB cap, SHA256 checksum, whitelisted extensions).<br>• **Team Writeups**: Private Markdown writeup submission and viewing for solved teams. |
| **Ephemeral Instances** | • **On-Demand Docker Containers**: Spawns isolated container instances per team.<br>• **TTL & Extension**: 30-minute default runtime with extension and manual stop controls.<br>• **Socket Proxy**: Interacts over HTTP via Docker socket proxy sidecar (no raw socket mounts). |
| **Security & Auth** | • **HttpOnly Cookie Architecture**: Browser never touches tokens; Next.js proxies all API requests.<br>• **Refresh Token Rotation**: Family reuse detection revokes all sessions on token theft.<br>• **Two-Factor Authentication**: RFC 6238 TOTP with QR codes and 8 recovery keys.<br>• **Brute Force Detection**: Flags accounts exceeding 50 failed attempts/hour in audit logs. |
| **Administration** | • **User Management**: Search, paginate, promote/demote admins, ban/unban with reasons.<br>• **Team Controls**: View rosters, delete teams, and reset team scores.<br>• **Event Settings**: Live countdown banner, start/end windows, and emergency pause toggle.<br>• **Immutable Audit Log**: Detailed audit trail of all sensitive operations. |
| **Observability** | • **Prometheus Metrics**: `/metrics` scraping endpoint with prebuilt Grafana dashboard.<br>• **Health Checks**: `/health` (Liveness) and `/ready` (PostgreSQL heartbeat).<br>• **Load Testing**: Pre-configured k6 script validating 200 concurrent VUs with p(95) < 500ms. |

---

## 📐 System Architecture

```
                                  [ Competitor Browser ]
                                            │
                             HTTP (Cookie Auth / SSE Stream)
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │      Nginx Reverse Proxy        │  :80 / :443
                           │  (Security Headers, Gzip, SSE)  │
                           └────────┬───────────────┬────────┘
                                    │               │
                     /api/* & Static│               │ /events/stream
                                    ▼               ▼
                        ┌──────────────────┐  ┌──────────────────┐
                        │ Next.js Frontend │  │  NestJS Backend  │  :4000
                        │ (App Router UI)  │  │ (REST API & SSE) │
                        └────────┬─────────┘  └────────┬─────────┘
                                 │ Internal Proxy      │
                                 └─────────────────────┤
                                                       ▼
                                            ┌──────────────────────┐
                                            │ PostgreSQL 16 Database│ :5432
                                            │ (Prisma ORM Engine)  │
                                            └──────────────────────┘
                                                       │
                                   ┌───────────────────┴───────────────────┐
                                   ▼                                       ▼
                       ┌──────────────────────┐               ┌──────────────────────┐
                       │  Groq AI Assistant   │               │ Docker Socket Proxy  │
                       │ (Llama 3.3 Nudges)   │               │ (Dynamic Instances)  │
                       └──────────────────────┘               └──────────────────────┘
```

---

## 🚀 Quickstart Guide

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows with WSL2 enabled)
- Node.js 20+ (optional for local commands)

### 1. Clone & Configure
```powershell
git clone https://github.com/Samieyu/lucy-ctf.git
cd lucy-ctf

# Copy example environment configuration
cp .env.example .env
```

### 2. Start Full Platform with Docker Compose
```powershell
docker compose up -d --build
```

### 3. Initialize Database & Seed Challenges
```powershell
# Run Prisma database migrations inside the API container
docker compose exec api npx prisma migrate dev --name init_advanced_features

# Seed challenges, hints, default event, and admin user
docker compose exec api npm run seed
```

### 4. Access the Services
- **Participant Web Portal:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger:** [http://localhost:4000](http://localhost:4000)
- **Health Checks:** [http://localhost:4000/health](http://localhost:4000/health) & [http://localhost:4000/ready](http://localhost:4000/ready)
- **Prometheus Metrics:** [http://localhost:4000/metrics](http://localhost:4000/metrics)

---

## 🔑 Default Credentials

The seed script creates a pre-configured platform administrator account:

| Account Type | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@lucyctf.io` | `LucyAdmin2026!` | Platform Admin (`isAdmin: true`) |

*Tip: You can also register a fresh account through the UI and promote it to Admin using the Admin Management UI or via direct SQL.*

---

## 🧪 Comprehensive End-to-End Testing Guide

Follow this step-by-step checklist to test all features of the platform:

### 1. Test Participant Registration & Teams
1. Navigate to [http://localhost:3000/register](http://localhost:3000/register).
2. Create two test accounts (e.g. `alice` and `bob`).
3. Log in as `alice`, navigate to **Team** (`/team`), and click **Create Team** (e.g. `CyberHawks`).
4. Copy the Team Invite Code, log in as `bob`, and join `CyberHawks`. Verify team membership updates in real-time.

### 2. Test Flag Submission & Dynamic Scoring
1. Navigate to **Challenges** (`/challenges`). Notice category filter chips and point pool summary.
2. Open challenge **"Welcome to Lucy CTF"** (`/challenges/1`).
3. Submit wrong flag: `LUCY{wrong_flag}`. Verify clear failure feedback.
4. Submit correct flag: `LUCY{w3lc0m3_t0_th3_dig}`.
5. Verify:
   - Green success alert appears with awarded points.
   - Challenge card changes to "Solved by your team".
   - First Blood banner appears indicating `CyberHawks` claimed First Blood with bonus points!
   - Real-time toast popup appears on screen.

### 3. Test Costed Hints
1. Open challenge **"Base Instincts"** (`/challenges/2`).
2. Expand **Hint #1** (Cost: 10 pts).
3. Click **Unlock**. Verify confirmation modal displays warning that 10 points will be deducted.
4. Confirm unlock. Verify hint text is revealed and team score decreases by 10 points on the leaderboard.

### 4. Test Groq AI Assistant
1. In any challenge, find the **"Ask AI For A Nudge"** section.
2. Ask: *"What encoding is used in this challenge?"*
3. Click **Get AI Nudge**.
4. Verify response provides a subtle explanation, redacts any flag patterns (`[redacted]`), and decrements the remaining uses counter (max 5).

### 5. Test Scoreboard & Live Freeze
1. Navigate to **Leaderboard** (`/leaderboard`).
2. Verify `CyberHawks` appears at Rank 1.
3. Switch between **Teams** and **Users** tabs to verify tie-breaking logic.
4. As an Admin, open `/admin/event`, set `freezeLeaderboardAt` to 5 minutes ago, and save.
5. In an incognito competitor window, verify the leaderboard displays the `❄️ Scoreboard Frozen` banner and serves the frozen snapshot.

### 6. Test Team Writeups
1. Return to the solved challenge **"Welcome to Lucy CTF"**.
2. Scroll to the **Team Writeup** editor.
3. Type a Markdown solution writeup and click **Save Writeup**.
4. Refresh the page to confirm the writeup persists and is only visible to team members.

### 7. Test Admin Management & Security Audit
1. Log in with `admin@lucyctf.io` / `LucyAdmin2026!`.
2. Click **Admin** dropdown in the Navbar:
   - **User Administration** (`/admin/users`): Search users, test banning a user with a reason, and test role promotion.
   - **Team Administration** (`/admin/teams`): Reset team score to 0 or delete a team.
   - **Audit Logs** (`/admin/audit`): Inspect audit logs, check the *"Show Suspicious Signals Only"* filter to review brute force and collision alerts.

### 8. Test Two-Factor Authentication (TOTP)
1. Navigate to **Account Settings** (`/profile`).
2. Click **Set Up Two-Factor Authentication**.
3. Scan the QR code with Google Authenticator or copy the manual base32 secret.
4. Enter the 6-digit TOTP code and click **Enable 2FA**.
5. Save the generated emergency backup recovery codes.
6. Log out and log back in. Verify the login form now prompts for 2FA verification!

### 9. Test Automated Unit Tests
Run backend Jest unit test suite:
```powershell
docker compose exec api npm test
```

### 10. Test Observability & Load Performance (k6)
Run simulated 200 concurrent user load test:
```powershell
k6 run scripts/loadtest.js
```

---

## 📁 Repository Structure

```
lucy-ctf/
├── .github/workflows/          # CI/CD (GitHub Actions lint, test, build, deploy)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 11 models (Event, Hint, AI, Instances, 2FA, Audit)
│   │   └── seed.ts             # Seeder with default event, admin, and challenges
│   ├── src/
│   │   ├── admin/              # User/team management & security audit trail
│   │   ├── attachments/        # Secure file uploads and downloads
│   │   ├── auth/               # JWT auth, 2FA TOTP, refresh rotation, passwords
│   │   ├── challenges/         # Challenge CRUD, parabolic scoring decay
│   │   ├── event/              # Event window control & emergency pause
│   │   ├── groq/               # Groq AI assistant with flag redaction
│   │   ├── health/             # /health, /ready, and Prometheus /metrics
│   │   ├── hints/              # Costed hint unlocking with score deduction
│   │   ├── instances/          # Docker socket proxy ephemeral containers
│   │   ├── leaderboard/        # Live rankings & frozen scoreboard snapshots
│   │   ├── mail/               # SMTP mailer with console dev fallback
│   │   ├── realtime/           # Server-Sent Events (SSE) stream service
│   │   ├── submissions/        # Atomic flag submission & first blood awards
│   │   ├── teams/              # Team creation, invite codes, captain succession
│   │   └── writeups/           # Markdown solution writeups
│   └── Dockerfile.prod         # Multi-stage production backend container
├── frontend/
│   ├── app/                    # Next.js App Router (challenges, admin, auth)
│   ├── components/             # Navbar, EventBanner, RealtimeNotifier toasts
│   ├── context/                # AuthContext with 2FA support
│   └── lib/                    # HTTP-only cookie proxy engine
├── nginx/                      # Nginx reverse proxy & SSE streaming config
├── docs/                       # Operations, Security, and Deployment guides
├── scripts/loadtest.js         # k6 performance test script (200 VUs)
├── docker-compose.yml          # Local development stack
├── docker-compose.prod.yml     # Production stack (with automated nightly DB backups)
└── ASSUMPTIONS.md              # Complete design decisions & specifications
```

---

## 🔒 Security Conventions

- **Flag Privacy**: Flags and flag hashes are **never** returned by any API endpoint, error message, or log output.
- **Zero Browser Direct Access**: The browser never talks to the NestJS API directly. All requests pass through Next.js proxy routes with HTTP-only cookies.
- **Refresh Token Family Invalidation**: Re-using an already-revoked refresh token revokes all active sessions for that user family.
- **Dynamic Scoping**: Challenge instances are isolated to 128MB RAM and 0.5 CPU cores with strict time limits.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
