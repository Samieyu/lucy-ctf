# Lucy CTF - Security Assessment & Architecture Review

## 1. High & Medium Security Safeguards Implemented

- **Flag Leak Prevention**: Flags are strictly stored as bcrypt hashes. No API projection, query, or log outputs `flag` or `flagHash`.
- **IDOR Protection in Writeups**: Non-admin users are strictly restricted to reading and modifying only their own team's writeups via server-side verification (`teamId = user.teamId`).
- **CSRF Defense**: Next.js proxy routes use `SameSite=Lax` and `HttpOnly` cookie policies. State-changing requests require explicit JSON bodies and authenticated user sessions.
- **Path Traversal Protection**: Uploaded files are stripped of original path components, stored under a cryptographically random UUID filename, and verified against an allowed extension whitelist (`.zip`, `.pdf`, `.pcap`, etc.).
- **SSRF Prevention in AI Assistant**: Groq integration sends requests exclusively to hardcoded `https://api.groq.com/openai/v1/chat/completions` with a strict 8-second timeout, without following user-supplied URLs.
- **Docker Hardening**: Production Dockerfiles run under unprivileged system users (`nextjs` UID 1001), use minimal multi-stage base images, and do NOT mount the host Docker socket. Dynamic challenge containers are executed inside an isolated internal bridge network (`ctf_isolated_net`) with memory and CPU bounds.
- **Refresh Token Rotation**: Single-use refresh tokens with family tracking. Reusing a revoked token automatically revokes the entire token family.

## 2. Low-Severity Findings & Recommendations

1. **CSP (Content-Security-Policy)**: Add granular script-src and style-src hashes if CDN assets or external scripts are added in the future.
2. **Dynamic Container Egress**: In production with dynamic instances, ensure iptables rules block outbound connections to local private subnets (`10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`).
3. **Database TLS**: When deploying PostgreSQL across separate cloud hosts, enable `sslmode=require` in `DATABASE_URL`.
