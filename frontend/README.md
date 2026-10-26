# Lucy CTF — Frontend Web Client (Next.js 16 + Tailwind CSS)

The Lucy CTF frontend is a modern web application built with **Next.js 16** (App Router, React 19), **TypeScript**, and **Tailwind CSS**. It follows an enterprise dark cybersecurity visual aesthetic.

---

## 🏗️ Architecture & Security Model

### HttpOnly Cookie Authentication Proxy
The frontend enforces a strict security perimeter:
- The browser **never** connects directly to the NestJS backend port.
- All requests are routed through Next.js API proxy routes (`app/api/...`), which read secure `httpOnly` cookies (`accessToken`, `refreshToken`) and forward requests to the internal backend.
- If a 401 Unauthorized status is received, the proxy route automatically attempts a refresh token rotation once, updates the client cookies, and seamlessly retries the original request.

---

## 📱 Page Map

```
app/
├── admin/
│   ├── audit/        # Security audit log viewer with suspicious brute-force filters
│   ├── challenges/   # Challenge authoring and CRUD
│   ├── event/        # Competition start/end, freeze, and emergency pause controls
│   ├── teams/        # Team roster review and score reset controls
│   └── users/        # Competitor management, ban controls, admin role promotion
├── challenges/
│   ├── [id]/         # Challenge detail, hints accordion, AI tutor, writeup editor, instances
│   └── page.tsx      # Category filter chips, point pool summary, solved badges
├── leaderboard/      # Real-time team and individual scoreboards with freeze banners
├── team/             # Team creation, invite code join, captain succession
├── profile/          # Account security, TOTP 2FA setup with QR code & recovery keys
├── login/            # Authentication with automatic TOTP 2FA detection
├── register/         # Competitor registration
├── forgot-password/  # Password reset request dispatch
└── reset-password/   # Token-authenticated password reset
```

---

## 🎨 Visual System & Components

- **Theme**: Deep space aesthetic (`neutral-950` background, emerald accents for successes, amber touches for warnings, rose highlights for first bloods).
- **[`EventBanner`](file:///c:/Users/User/Desktop/LUCY%20CTF/lucy-ctf/frontend/components/EventBanner.tsx)**: Persistent countdown timer displaying competition time remaining, paused status, or ended status.
- **[`RealtimeNotifier`](file:///c:/Users/User/Desktop/LUCY%20CTF/lucy-ctf/frontend/components/RealtimeNotifier.tsx)**: Server-Sent Events (SSE) subscriber rendering real-time solve and first blood toast alerts.

---

## 💻 Development Commands

```powershell
# Install dependencies:
npm install

# Run Next.js development server:
npm run dev

# Build production standalone bundle:
npm run build

# Start production server:
npm start
```
