# todo.md — Syncora Task Tracker

Status legend: `[ ]` Planned · `[~]` In Progress · `[x]` Done

---

## Phase 1 — Project Foundation
**Goal:** Local development environment running, database connected, CI-ready.

- [ ] Create NestJS project
- [ ] Create Next.js project
- [ ] Configure Docker Compose
- [ ] Configure PostgreSQL container
- [ ] Configure Prisma (schema.prisma, datasource, generator)
- [ ] Configure ESLint (backend + frontend)
- [ ] Configure Prettier
- [ ] Configure Husky pre-commit hooks
- [ ] Configure environment variables (`.env.example`)
- [ ] Verify application starts and DB connection succeeds

**Exit criteria:** App starts · Database connection verified

---

## Phase 2 — Database Layer
**Goal:** Production-ready schema with migrations and seed data.

- [ ] Design 3NF schema (users, work_orders, status_history, notifications, audit_logs)
- [ ] Write Prisma migrations
- [ ] Write seed script (demo moderator, technicians, customers, sample orders)
- [ ] Add indexes on foreign keys and filtered columns
- [ ] Create immutable audit_logs table (append-only, no update/delete)
- [ ] Verify migration runs cleanly from scratch

**Exit criteria:** Migration runs · Seed script works

---

## Phase 3 — Authentication & Authorization
**Goal:** Secure auth system with RBAC enforced on all routes.

- [ ] User registration endpoint (`POST /auth/register`) with bcrypt hashing
- [ ] Login endpoint (`POST /auth/login`) — issues JWT access token + refresh token in HttpOnly cookies
- [ ] Refresh token rotation endpoint (`POST /auth/refresh`)
- [ ] Logout endpoint — invalidates refresh token server-side
- [ ] JWT auth guard (NestJS)
- [ ] Role guard (`MODERATOR | TECHNICIAN | CUSTOMER`)
- [ ] Ownership guard (customers scoped to their own orders)
- [ ] Auth middleware on all protected routes
- [ ] Frontend `AuthGuard` component (redirects unauthenticated users)
- [ ] Login page (`/login`) — email + password, error alert, demo hints
- [ ] Register page (`/register`) — full name + email + password (min 6 chars)

**Exit criteria:** Users can authenticate · Unauthorized access blocked at API and UI level

---

## Phase 4 — Work Order Core
**Goal:** Full work-order lifecycle from creation to completion.

- [ ] Create work order (Moderator)
- [ ] Edit work order (Moderator)
- [ ] Assign technician to order (Moderator)
- [ ] Technician status update (Pending → En Route → In Progress → Completed)
- [ ] Status history log per order
- [ ] Customer order tracking view (read-only, scoped to their orders)
- [ ] Audit log entries for: assignment, status changes

**Exit criteria:** Moderator manages orders · Technician updates jobs · Customer tracks progress

---

## Phase 5 — Dashboard
**Goal:** Operational dashboard reflecting live database data.

- [ ] Dashboard shell (layout, sidebar, topbar, theme toggle, breadcrumbs)
- [ ] Overview page — 4 StatCards (Active Jobs hero card, Pending Alerts, Online Technicians, Completions Today)
- [ ] JobTable with columns: Order ID, Customer, Technician, Work Type, Location, Date, StatusPill, View button
- [ ] AlertsPanel (`aria-live="polite"`, 280px scroll, color-coded left borders)
- [ ] Work Orders page — filter bar (status pills, date range, search), full JobTable
- [ ] People page (Moderator) — technician roster with search, avatar, StatusPill
- [ ] Settings page (Moderator) — notification toggles, access control rows
- [ ] User work-orders view — ProgressTracker (Received → Assigned → En Route → In Progress → Completed)
- [ ] Mobile technician view — JobCardStack (swipeable), swipe right = complete, swipe left = flag
- [ ] Empty states: EmptyJobs, EmptyTechnicians, NetworkError, EmptyAlerts, EmptySearch
- [ ] Skeleton loading states for all data-fetching components

**Exit criteria:** Dashboard reflects live database data across all roles

---

## Phase 6 — Notification System
**Goal:** Users receive in-app notifications with read/unread state and toast delivery.

- [ ] Notification CRUD (create, list, mark read, mark all read)
- [ ] Alert history list in AlertsPanel
- [ ] Read/unread state persistence
- [ ] Toast integration — types: job assigned (blue), en route (blue), delay alert (red), job completed (green), system error (red)
- [ ] Toast auto-dismiss: 5s default, 10s for urgent
- [ ] "View" CTA on each toast deep-linking to relevant order
- [ ] Notification bell badge in TopBar (unread count)

**Exit criteria:** Users receive notifications · Toasts appear on relevant events

---

## Phase 7 — Real-time System
**Goal:** Status updates propagate instantly via WebSocket.

- [ ] Socket.IO Gateway (NestJS) — rooms per role + per order
- [ ] `useSocket()` hook (frontend) — connects, listens, reconnects
- [ ] Online presence tracking for technicians
- [ ] Real-time dashboard row updates (flash animation on status change, slide-in for new rows, fade-out for completed)
- [ ] "Last updated X seconds ago" TopBar label — resets on WS event
- [ ] Connection indicator dot (green/amber/red) in TopBar
- [ ] SSE polling fallback (15s) when WebSocket unavailable

**Exit criteria:** Status updates propagate instantly · UI reflects live changes without page refresh

---

## Phase 8 — Mobile Technician Experience
**Goal:** Complete technician workflow on mobile devices.

- [ ] Responsive layout breakpoints (≤ 767px mobile, 768px+ desktop)
- [ ] JobCardStack — swipeable vertical stack, active job pinned to top
- [ ] JobCard — large tap targets (min 48px), order ID, customer, work type, location pin, ETA, StatusPill
- [ ] "Navigate" CTA → opens device Maps app
- [ ] "Update status" CTA → inline status picker
- [ ] Swipe right → mark step complete
- [ ] Swipe left → flag issue / request support
- [ ] MobileSidebar Sheet (hamburger trigger in TopBar)

**Exit criteria:** Complete technician workflow completable on a mobile device

---

## Phase 9 — Analytics
**Goal:** Operational reporting from production data.

- [ ] KPI summary dashboard section
- [ ] Order completion metrics (daily/weekly)
- [ ] Technician performance metrics (orders completed, average time)
- [ ] Alert frequency metrics
- [ ] Data aggregated from production database (not mocked)

**Exit criteria:** Metrics generated and displayed from real production data

---

## Phase 10 — Maps (Sprint 2)
**Goal:** Live technician tracking and route visualization.

- [ ] Mapbox GL JS integration (`mapbox-gl` package)
- [ ] Light/dark map style tied to `syncora-theme` (`light-v11` / `dark-v11`)
- [ ] TechnicianMap — real-time technician coordinates via WebSocket, custom SVG pins with avatar initials + pulse ring
- [ ] "Last position updated X min ago" label per pin
- [ ] OrderTrackingMap — polyline route, animated technician marker, destination pin, ETA badge
- [ ] Remove `data-placeholder="true"` attributes and "Live map coming soon" watermarks
- [ ] Update Storybook stories (remove `[PLACEHOLDER]` tags)

**Exit criteria:** Location updates visible on dashboard · Technician position updates in real time
