# Lucy CTF

A self-hosted Capture-The-Flag (CTF) platform. Named after "Dinkinesh" (Lucy), the famous hominid fossil discovered in Ethiopia — a nod to discovery and piecing together hidden fragments, much like solving a CTF challenge.

## Stack

- **Frontend:** Next.js (React, TypeScript, Tailwind CSS)
- **Backend:** NestJS (Node.js, TypeScript)
- **Database:** PostgreSQL
- **Containerization:** Docker / Docker Compose
- **AI:** Groq API (planned — hints/assist features)

## Project Structure

```
lucy-ctf/
├── frontend/          # Next.js app
├── backend/           # NestJS app
├── docker-compose.yml # Local dev orchestration
├── .env.example        # Copy to .env and fill in secrets
└── README.md
```

## Getting Started (Local Dev)

1. Copy the env file and adjust values:
   ```bash
   cp .env.example .env
   ```

2. Start everything with Docker Compose:
   ```bash
   docker compose up --build
   ```

3. Services:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - PostgreSQL: localhost:5432

## Development without Docker (optional)

**Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Status

🚧 Early development — Week 1, Day 1 scaffold. See `docs/` (coming soon) for the architecture doc and execution plan.

## License

TBD
# lucy-ctf
