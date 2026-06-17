# architecture.md — Syncora System Architecture

## Stack Overview

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui + class-variance-authority |
| UI Primitives | Radix UI |
| State Management | Zustand |
| Server State | TanStack Query |
| Icons | lucide-react |
| Animation | tailwindcss-animate |
| Maps (Sprint 2) | Mapbox GL JS |

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | NestJS (modular architecture) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access token) + Refresh token rotation |
| Real-time | Socket.IO Gateway |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Containerization | Docker Compose |
| Database container | PostgreSQL |
| Secrets | Environment variables + Docker Secrets |

---

## Application Layers

```
Client (Browser / Mobile)
    │
    ├── Next.js Pages & Components
    │       ├── TanStack Query (server state, caching)
    │       ├── Zustand (client state)
    │       └── Socket.IO client (real-time)
    │
    ▼
NestJS API (REST + WebSocket Gateway)
    │
    ├── Auth Module (JWT, Refresh Tokens, Guards)
    ├── Work Orders Module
    ├── Users / Technicians Module
    ├── Notifications Module
    ├── Analytics Module
    ├── Socket Gateway (Socket.IO)
    └── Audit Logger (immutable log)
    │
    ▼
Prisma ORM
    │
    ▼
PostgreSQL (Docker container)
```

---

## Authentication Flow

1. Client submits credentials → `POST /auth/login`
2. Server validates password with bcrypt → issues short-lived **JWT access token** + long-lived **refresh token**
3. Both tokens stored in **HttpOnly, Secure, SameSite=strict cookies** — never in localStorage
4. Client uses access token for API requests (Authorization header injected server-side)
5. On expiry, client calls `POST /auth/refresh` → server rotates refresh token, issues new access token
6. Logout invalidates the refresh token server-side

---

## Authorization Model (RBAC)

Roles: `MODERATOR | TECHNICIAN | CUSTOMER`

Enforcement layers:
- **NestJS Route Guards** — protect API endpoints by role
- **Ownership Guards** — customers may only access their own work orders
- **Frontend Route Guards** (`AuthGuard`) — blocks unauthenticated navigation
- **Sidebar nav** — role-filtered via `lib/roles.ts`

---

## Real-time Architecture

```
Socket.IO Gateway (NestJS)
    │
    ├── Emits: job_assigned, status_updated, technician_location, system_alert
    └── Rooms: per-role broadcasts + per-order rooms
    │
    ▼
useSocket() hook (Frontend)
    ├── Updates TanStack Query cache on event
    ├── Triggers toast notifications (ToastProvider)
    └── Refreshes "Last updated" TopBar label
    │
Fallback: SSE polling every 15s if WebSocket unavailable
```

**Connection states** (TopBar dot indicator):
- Green → connected
- Amber → reconnecting
- Red → disconnected

---

## Database Design Principles

- **3NF normalized schema**
- Prisma ORM only — no raw SQL, no `queryRawUnsafe`
- Parameterized queries enforced by Prisma
- Indexed foreign keys and frequently filtered columns
- **Audit tables** — immutable log for: login, logout, role changes, technician assignments, status updates, user management actions

---

## Security Layers Summary

| Threat | Mitigation |
|--------|-----------|
| Credential theft | bcrypt hashing, HttpOnly cookies, no JWT in localStorage |
| SQL Injection | Prisma ORM + parameterized queries only |
| XSS | React escaping, CSP headers, DOM sanitization for user content |
| CSRF | SameSite=strict cookies + CSRF token validation |
| Brute force | Login rate limiting (ThrottlerModule) |
| Over-fetching | DTO validation (ValidationPipe), ownership guards |
| Secrets exposure | Environment variables + Docker Secrets, never committed |

**Required security headers:** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Availability | 99.9% uptime |
| API response time | < 300ms |
| Security standard | OWASP Top 10 mitigated |
| Scalability | 10,000+ work orders |
| Auditability | All critical actions logged immutably |

---

## Frontend Component Architecture

```
/components
    /shared         → Logo, Breadcrumbs, StatusPill, Skeleton
    /ui             → Radix-based primitives (Button, Badge, Toast, Dialog…)
    /layout         → DesktopSidebar, MobileSidebar, TopBar, ThemeProvider
    /dashboard      → StatCards, JobTable, TechnicianMap, AlertsPanel
    /work-orders    → JobCardStack, JobCard, ProgressTracker, OrderTrackingMap
    /people         → TechnicianCard
    /empty-states   → EmptyJobs, EmptyTechnicians, NetworkError, EmptyAlerts, EmptySearch
```

State ownership:
- **TanStack Query** → all server data (orders, technicians, notifications)
- **Zustand** → UI state (sidebar open, active filters, theme preference mirror)
- **Socket events** → invalidate or update TanStack Query cache directly
