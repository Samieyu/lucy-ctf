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
