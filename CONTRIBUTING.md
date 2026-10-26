# Contributing to Lucy CTF

Thank you for your interest in contributing to **Lucy CTF**! We welcome bug reports, feature suggestions, security audits, and code contributions.

---

## 🛠️ Development Workflow

1. **Fork or Branch**:
   Create a descriptive branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Conventions to Maintain**:
   - **Zero-Leak Rule**: Never return `flag` or `flagHash` across any API, response object, or log statement.
   - **Browser Isolation**: The browser must never communicate directly with NestJS. Always route through Next.js proxy endpoints (`app/api/...`) with httpOnly cookie authentication.
   - **Prisma Schema Changes**: Always generate a corresponding migration using `npx prisma migrate dev`.
   - **TypeScript Strictness**: Keep strict type annotations; use `import type { Request } from 'express'`.

3. **Running Quality Checks**:
   ```bash
   # Run backend unit tests:
   cd backend
   npm test

   # Run type check and build:
   npm run build
   ```

4. **Submitting Pull Requests**:
   - Ensure all automated GitHub Actions CI workflows pass.
   - Provide a clear summary of your changes and any database schema additions.
