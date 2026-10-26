# Lucy CTF - Development Assumptions

This document tracks all assumptions made during the autonomous build of Lucy CTF.

## Step 1: Flag Submission + Scoring
- **Team-level Solves (409 Conflict)**: When a challenge has already been solved by any member of the user's team, the submission is rejected with HTTP 409 (`ConflictException`) and no points or additional solve credits are awarded to the team.
- **Team Requirement (400 Bad Request)**: Users must belong to a team before submitting flags (`user.teamId` must not be null). If not on a team, the request returns HTTP 400 (`BadRequestException`).
- **Atomic Scoring**: Every attempt is recorded in the `Submission` table. On a correct flag, the creation of the correct `Submission` and the `Score` upsert-increment (along with updating `lastScoredAt` to `now()`) are executed inside a Prisma `$transaction`.
- **Constraint Removal**: The `@@unique([userId, challengeId, isCorrect])` constraint on `Submission` is removed so participants can submit repeated incorrect flag attempts without database constraint violations.
- **Flag Sanitization**: Flags are compared against the bcrypt `flagHash` both verbatim and trimmed of whitespace, accommodating accidental whitespace when copying.

## Step 2: Challenge List with Solved Status
- **Public List Endpoint**: Extended `GET /challenges` to accept optional `?category=` filter query param.
- **Solved Property**: `solved: boolean` is `true` if the requesting user's team has solved the challenge (or if the user has solved it if no team, though team membership is standard).
- **Solve Count**: `solveCount: number` reflects the total number of distinct teams (or successful solves) that completed the challenge.
- **Security**: Flags and `flagHash` remain strictly excluded from all public responses.

## Step 3: Leaderboard
- **Team Leaderboard (`GET /leaderboard/teams`)**: Ranks teams by `Score.points DESC`, breaking ties by earliest `Score.lastScoredAt ASC`. Limited to top 100 teams. Returns `{ rank, name, points, solves }`.
- **User Leaderboard (`GET /leaderboard/users`)**: Ranks users by the sum of points from their correct submissions, breaking ties by earliest solve time. Returns `{ rank, name, points, solves }`.

## Step 4: Rate Limiting & Security
- **Throttler Limits**: Global throttling is 100 requests/minute. Critical endpoints (`/auth/login`, `/auth/register`, and `/challenges/:id/submit`) are throttled to 10 requests/minute per IP/user.
- **Security Headers & CORS**: Integrated `helmet` with secure defaults. CORS configured specifically for `FRONTEND_URL` with credentials allowed.
- **Token Refresh (`POST /auth/refresh`)**: Validates refresh token signed with `JWT_REFRESH_SECRET` (fallback `JWT_SECRET`) and issues a fresh 15-minute access token.

## Step 5: Participant UI
- **Proxy Token Refresh**: When Next.js API proxy routes encounter a 401 from NestJS, they automatically read `refreshToken` from httpOnly cookies, call backend `POST /auth/refresh`, update the client's `accessToken` cookie, and seamlessly retry the original request.
- **Leaderboard Polling**: Auto-polls every 15 seconds, displays visual indicator for the current user's team, and supports switching between Teams and Users tabs.
- **Challenge Submissions**: Challenge detail page provides clear real-time feedback (Success, Wrong Flag, Already Solved by Team, No Team Joined) and updates solve status immediately.

## Step 6: Navigation & UI Theme
- **Consistent Layout**: Shared top navigation bar visible across all authenticated routes (`/dashboard`, `/challenges`, `/challenges/[id]`, `/leaderboard`, `/team`, and `/admin/*`).
- **Theme Palette**: Deep dark theme (`neutral-950` background, subtle earthy/gold touches, emerald accents).

## Step 7: Tests
- **Backend Test Suite**: Full Jest unit test coverage for SubmissionsService (correct flag, wrong flag, team already solved, user without team) and LeaderboardService.

## Step 8: Production Deployment
- **Multi-Stage Dockerfiles**: Production containers with minimal image footprint, running `node dist/main` in backend and standalone server in Next.js.
- **Migration & Healthchecks**: Automatically executes `prisma migrate deploy` before API startup.

---

## ADVANCED FEATURES (Steps A through L)

### Step A: Event Control (CTF Window & Freeze)
- **Singleton Table**: `EventSettings` has a single row (`id: "global"`) created or seeded at first boot.
- **Window Gating**: If `isPaused` is true or if current time is outside `[startsAt, endsAt]`, flag submissions are rejected with HTTP 403.
- **Leaderboard Freeze**: When `now >= freezeLeaderboardAt` and the viewer is not an admin, public leaderboards compute standings using only solves submitted on or before `freezeLeaderboardAt`. Admins bypass the freeze and always see live data.
- **Navbar Banner**: Real-time countdown banner displays CTF starts in, time remaining, competition paused, or competition ended states.

### Step B: Hints with Cost
- **Score Deduction**: Unlocking a hint deducts its cost from `Score.points` atomically inside a Prisma transaction and records a `HintUnlock` row.
- **Zero Cost or Unlocked**: Unlocked hints or free hints return the hint `text`. Locked hints never expose `text` in any API.
- **Confirmation Dialog**: Frontend UI presents an explicit confirmation dialog informing the participant that points will be subtracted from their team's score.

### Step C: Groq AI Hint Assistant
- **Flag Sanitization & Redaction**: The model prompt never includes the challenge flag or hash. Responses from Groq are filtered through regex to replace any strings matching flag formats (`FLAG{...}`, `LUCY{...}`) with `[redacted]`.
- **Usage Throttling**: Limited to 5 requests per user per challenge, tracked in the `AiHintUsage` table.
- **Timeout & Fallback**: Requests timeout after 8 seconds; if `GROQ_API_KEY` is absent or the API fails, a graceful fallback message is returned.

### Step D: Dynamic Scoring & First Blood
- **Scoring Formulas**: Challenges support `STATIC` or `DYNAMIC` mode. Dynamic scoring uses standard CTFd parabolic decay between `initialPoints` and `minPoints` based on `decay` solve thresholds.
- **First Blood**: The first team to solve a challenge earns a configurable first blood bonus (default 20%). Concurrent first blood attempts are handled safely with database unique constraints on `challengeId`.

### Step E: File Attachments & Writeups
- **Attachment Guardrails**: Files are limited to 25MB with whitelisted extensions (`.zip`, `.tar.gz`, `.pcap`, `.elf`, `.bin`, `.txt`, `.py`, `.c`, etc.). Stored using UUID filenames and served via authenticated streaming with SHA256 checksum verification.
- **Team Writeups**: Markdown writeups can only be submitted and viewed by members of the team that solved the challenge or by platform administrators.

### Step F: Admin Management & Audit Logs
- **Audit Trails**: All sensitive actions (login, flag submit, user ban, role modification, score reset, event setting update) are written to `AuditLog`.
- **Brute Force & Collision Detection**: Rapid failed flag submissions (>50/hour) or IP collisions across multiple teams trigger `isSuspicious: true` signals in the audit log.

### Step G: Account Security (2FA & Refresh Rotation)
- **TOTP 2FA**: RFC 6238 time-based one-time passwords via `otplib`. Generates 8 single-use recovery codes upon activation.
- **Refresh Token Rotation**: Refresh tokens belong to a `familyId`. If an already-revoked refresh token is re-submitted, all active tokens in that family are immediately revoked (reuse attack detection).
- **Email Verification & Password Reset**: SMTP mailer with console fallback for local development. Secure single-use tokens expiring in 1 hour.

### Step H: Real-time Updates (SSE)
- **Server-Sent Events**: Real-time broadcast channel at `GET /events/stream` pushing solve events, first blood announcements, and freeze updates to connected clients.
- **Frontend Realtime Notifier**: Toast popup notifications appear automatically upon receiving SSE broadcasts.

### Step I: Dynamic Challenge Instances
- **Docker Socket Proxy**: The backend talks to a Docker socket proxy over HTTP rather than mounting the raw Unix socket directly into the application container.
- **Resource Limits & TTL**: Ephemeral containers are constrained to 128MB RAM, 0.5 CPU, and a 30-minute default TTL (extendable by 15m), gated behind the `INSTANCES_ENABLED` environment flag.

### Step J: Observability & Performance
- **Database Indexing**: Comprehensive B-tree and composite indexes on `submissions(userId, challengeId, isCorrect, submittedAt)`, `users(teamId)`, `audit_logs(createdAt, isSuspicious)`.
- **Health & Metrics**: Liveness (`/health`), Readiness (`/ready` with PostgreSQL `SELECT 1`), and Prometheus metrics (`/metrics`).
- **Load Testing**: k6 load test script (`scripts/loadtest.js`) validating 200 concurrent VUs with `p(95) < 500ms`.

### Step K & L: Production Architecture & Security Review
- **Reverse Proxy**: Nginx reverse proxy with bufferless SSE streaming, gzip compression, 30MB body limit, and hardened SSL cipher suites.
- **Automated Backups**: Nightly postgres database backup service with 7-day retention in `docker-compose.prod.yml`.
- **Security Guide**: Comprehensive `docs/SECURITY.md`, `docs/DEPLOYMENT.md`, and `docs/OPERATIONS.md`.
