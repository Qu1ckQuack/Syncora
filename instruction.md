# instruction.md — Syncora Project Instructions

## Project Setup

### Prerequisites
- Node.js (LTS)
- Docker + Docker Compose
- A `.env` file at repo root (see Environment Variables section)

### Bootstrap
```bash
# 1. Clone and install dependencies
cd syncora-backend && npm install
cd ../syncora-frontend && npm install

# 2. Start infrastructure
docker-compose up -d

# 3. Run database migrations and seed
cd syncora-backend
npx prisma migrate dev
npx prisma db seed

# 4. Start development servers
# Backend
npm run start:dev
# Frontend (separate terminal)
cd ../syncora-frontend && npm run dev
```

**Exit criteria for setup:** application starts, database connection verified, login page loads at `localhost:3000/login`.

---

## Environment Variables

Never commit secrets. All sensitive values go in `.env` and are listed in `.env.example`.

Required variables:
```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
MAPBOX_TOKEN=          # Sprint 2 only
```

Use Docker Secrets for production deployments.

---

## Security Rules (Non-Negotiable)

These rules apply to every feature, every PR:

- **Never** store JWT tokens in `localStorage` or `sessionStorage`
- **Never** store passwords in plaintext — bcrypt only
- **Never** expose refresh tokens to the client beyond HttpOnly cookies
- **Never** use `queryRawUnsafe` or string-concatenated SQL — Prisma ORM only
- **Never** hardcode secrets or API keys — environment variables only
- **Never** commit `.env` files
- All cookies: `HttpOnly`, `Secure`, `SameSite=strict`
- All API inputs validated via NestJS `ValidationPipe` + DTOs before any business logic

---

## Coding Conventions

### General
- TypeScript strict mode — no `any` without explicit justification
- Feature-based folder structure on both frontend and backend
- Barrel exports (`index.ts`) per feature module

### Frontend
- Use CSS custom property tokens from `globals.css` for all colors — never hardcode hex values in components
- Status colors only via semantic tokens (`--color-status-*`) — never inline Tailwind color classes for status
- All interactive elements must have `focus-visible:ring-2 focus-visible:ring-syncora-500 focus-visible:ring-offset-2`
- No information conveyed by color alone — always pair color with an icon (WCAG 2.1 AA)
- Decorative icons: `aria-hidden="true"`. Meaningful icons: explicit `aria-label`
- All animations must respect `prefers-reduced-motion: reduce`
- Map components in Sprint 1 must render with `data-placeholder="true"` — never ship decorative maps to production

### Backend
- One module per domain (auth, work-orders, users, notifications, analytics)
- Guards applied at controller level, not inside service methods
- Audit logging triggered in service layer, not controllers
- Audit logs are append-only — no update or delete operations on audit tables

---

## Git Workflow

- Husky pre-commit hooks enforce ESLint + Prettier
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- PRs require security review checkbox for any auth, RBAC, or data access changes
- Feature branches off `main`, merged via PR — no direct pushes to `main`

---

## Definition of Done

A feature is **not complete** until all of the following are true:

- [ ] Code implemented
- [ ] Unit tests written
- [ ] API endpoint documented
- [ ] Authorization verified (correct roles blocked/allowed)
- [ ] Input validation implemented (DTO + ValidationPipe)
- [ ] Audit logging implemented for critical actions
- [ ] Error handling implemented (no unhandled rejections, proper HTTP status codes)
- [ ] Mobile responsive (≥ 375px viewport)
- [ ] Security review passed
- [ ] Storybook story added for new UI components (light/dark/empty/mobile variants)
