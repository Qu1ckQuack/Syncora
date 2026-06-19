# todo.md — Syncora Task Tracker

Status legend: `[ ]` Planned · `[~]` In Progress · `[x]` Done · `[-]` Skipped / Deferred

---

## Phase 1 — Project Foundation
**Goal:** Local development environment running, database connected, CI-ready.

- [x] Create NestJS project
- [x] Create Next.js project
- [x] Configure Docker Compose with PostgreSQL 16
- [x] Configure Prisma (schema, datasource, generator)
- [x] Configure ESLint (backend + frontend)
- [x] Configure Prettier
- [x] Configure Husky pre-commit hooks (lint-staged)
- [x] Configure environment variables (`.env`, `.env.example`)
- [x] Verify application starts and DB connection succeeds

**Exit criteria:** App starts · Database connection verified

---

## Phase 2 — Database Layer
**Goal:** Production-ready schema with migrations and seed data.

- [x] Design schema (8 models: User, WorkOrder, StatusHistory, Notification, NotificationPreference, RefreshToken, TechnicianLocation, AuditLog)
- [x] Write Prisma migrations (5 migrations applied)
- [x] Write seed script (5 users, 6 orders, notifications, audit logs, preferences)
- [x] Add indexes on foreign keys and filtered columns
- [x] Create immutable audit_logs table (append-only)
- [x] Verify migration runs cleanly from scratch

**Exit criteria:** Migration runs · Seed script works

---

## Phase 3 — Authentication & Authorization
**Goal:** Secure auth system with RBAC enforced on all routes.

- [x] User registration endpoint (`POST /auth/register`) with bcrypt
- [x] Login endpoint (`POST /auth/login`) — JWT access + refresh in HttpOnly cookies
- [x] Refresh token rotation endpoint (`POST /auth/refresh`)
- [x] Logout endpoint — invalidates refresh token server-side
- [x] JWT auth guard (NestJS)
- [x] Role guard (`MODERATOR | TECHNICIAN | CUSTOMER`)
- [x] Ownership guard (customers scoped to their own orders)
- [x] `@Roles()` and `@CurrentUser()` decorators
- [x] Frontend `AuthGuard` component (redirects unauthenticated)
- [x] Login page (`/login`) — email + password, error alert, demo hints
- [x] Register page (`/register`) — name + email + password (min 6 chars)

**Exit criteria:** Users can authenticate · Unauthorized access blocked at API and UI

---

## Phase 4 — Work Order Core
**Goal:** Full work-order lifecycle from creation to completion.

- [x] Create work order (Moderator + Customer)
- [x] Edit work order (Moderator)
- [x] Assign technician to order (Moderator)
- [x] Technician status update (validated transitions)
- [x] Status history log per order
- [x] Customer order tracking view (read-only, scoped to own orders)
- [x] Audit log entries for: creation, updates, assignment, status changes
- [x] Work type dropdown (12 predefined types + "Other" free-text)

**Exit criteria:** Moderator manages orders · Technician updates jobs · Customer tracks + creates orders

---

## Phase 5 — Dashboard
**Goal:** Operational dashboard reflecting live database data.

- [x] Dashboard shell — Sidebar (role-filtered nav), TopBar (search, connection dot, updated-ago, bell, theme), Breadcrumbs
- [x] Overview page — 4 StatCards (Total, In Progress, Completed, Pending Urgent) with trends
- [x] Responsive: OrderCard stack on mobile, `<table>` on desktop
- [x] Work Orders page — filter bar (status pills, search), responsive table
- [x] AlertsPanel (slideover + sidebar, type icons, read/unread, mark-all-read)
- [x] People page — technician roster with search, avatar, status, job count
- [x] People page — inline edit, ban/unban, delete (FK conflict detection)
- [x] Settings page — notification preferences (persisted), appearance toggle
- [x] Customer profile — ProgressTracker (3 steps), active order, order history
- [x] Empty states and skeleton loading for all data-fetching views
- [x] Mobile bottom tab bar + sidebar drawer

**Exit criteria:** Dashboard reflects live database data across all roles

---

## Phase 6 — Notification System
**Goal:** In-app notifications with read/unread state, preferences, and toast delivery.

- [x] Notification CRUD (create, list, mark read, mark all read)
- [x] Alert history list in AlertsPanel with type-specific icons
- [x] Read/unread state persistence (DB)
- [x] Unread count endpoint + badge in TopBar
- [x] Toast system — 4 types, auto-dismiss, Zustand store
- [x] Toast on socket events (connect, disconnect, reconnect)
- [x] Notification preferences model (email, push, status, assignment booleans)
- [x] `GET` / `PUT /notifications/preferences` endpoints
- [x] Settings page toggles persisted to backend
- [x] Seed script creates default preferences for all users

**Exit criteria:** Users receive notifications · Toasts appear · Preferences persist

---

## Phase 7 — Real-time System
**Goal:** Status updates propagate instantly via WebSocket.

- [x] Socket.IO Gateway — JWT auth from cookie, rooms per user + role
- [x] `emitToUser()`, `emitToRole()`, `broadcast()` methods
- [x] `useSocket()` hook — connects, listens, reconnects, exposes status
- [x] Socket events: `notification.new`, `workOrder.statusChanged`, `workOrder.assigned`, `location.update`
- [x] TanStack Query cache invalidation on all socket events
- [x] Connection indicator dot (green/amber/red) in TopBar
- [x] "Last updated X seconds ago" label in TopBar
- [x] **"Last updated" resets on WS event** — Timer-driven + event-triggered via `useSocket(onEvent)` callback
- [x] SSE / polling fallback when WebSocket unavailable — Conditional `refetchInterval: 15_000` via `useConnectionStore`

**Exit criteria:** Status updates propagate instantly · UI reflects live changes without page refresh

---

## Phase 8 — Mobile Responsiveness & Maps
**Goal:** Complete mobile experience with live technician tracking.

- [x] Responsive breakpoints across all pages
- [x] Bottom tab bar (`< lg`) with role-filtered nav
- [x] Mobile sidebar drawer (fixed overlay + slide-in)
- [x] TopBar: expandable search on mobile
- [x] Work orders: OrderCard stack on mobile, table on desktop
- [x] Overview: OrderCard stack on mobile, table on desktop
- [x] Touch targets: 44px min on TopBar buttons, nav triggers, form actions
- [x] Leaflet map integration (OpenStreetMap tiles, react-leaflet)
- [x] Map page (`/dashboard/map`) — work order + technician markers with popups
- [x] LocationPicker on create-order form (click-to-place marker)
- [x] Backend LocationModule — REST + WebSocket `location.update`
- [x] TechnicianLocation model + migration
- [x] Nominatim geocoding on order create/update
- [x] Swipeable JobCardStack (swipe right complete / left flag) — Pointer-event gestures, next-status advance, flag-as-delayed
- [x] "Navigate" CTA opening device Maps app — Platform-detected maps:// or Google Maps URL
- [x] Inline status picker on OrderCard — Valid-transition dropdown, immediate mutation
- [x] ETA display on OrderCard — From scheduledStart: "ETA: 2:30 PM" / "~45 min" / "Started Xm ago"

**Exit criteria:** Technician workflow completable on mobile · Live map with technician positions

---

## Phase 9 — Analytics
**Goal:** Operational reporting from production data.

- [x] KPI summary cards (client-side computed from raw work orders — placeholder)
- [x] Backend analytics module (service + 4 aggregation methods)
- [x] Order completion metrics (daily/weekly trend endpoint)
- [x] Technician performance metrics (orders completed, average time)
- [x] Alert frequency metrics (by notification type)
- [x] Analytics overview endpoint (`GET /analytics/overview`)
- [x] Completion trend endpoint (`GET /analytics/trends/completion?days=&period=`)
- [x] Technician performance endpoint (`GET /analytics/technicians` — MODERATOR)
- [x] Alert frequency endpoint (`GET /analytics/alerts?days=` — MODERATOR)
- [x] Frontend analytics hooks (`use-analytics.ts` — 4 TanStack Query hooks)
- [x] Overview page uses real `completionRate` trend (replaces hardcoded values)
- [x] Dedicated `/dashboard/analytics` page with period selector, recharts bar charts, tech table
- [x] Analytics nav item added for MODERATOR role

**Exit criteria:** Metrics generated from real production data

---

## Phase 10 — Maps Refinement
**Goal:** Enhanced map features and route visualization.

- [x] Map page rendered with Leaflet + OpenStreetMap
- [x] Work order markers (status-colored, popup with details)
- [x] Technician markers (status-colored, initial, popup with info)
- [x] Real-time technician coordinate updates via WebSocket
- [ ] Polyline routes from technician to work orders
- [ ] Animated technician marker along route
- [ ] Destination pin on work order location
- [ ] ETA badge on technician marker
- [ ] "Last position updated X min ago" per marker

**Exit criteria:** Route visualization with live technician movement

---

---

## Phase 11 — API Testing & Bug Fixing
**Goal:** Comprehensive endpoint testing; all 41 tests passing.

- [x] Test suite executed: 41 tests across auth, users, work orders, notifications, locations, RBAC
- [x] Bug found + fixed: `POST /work-orders` missing `@RolesGuard` — technicians could create orders
- [x] Bug found + fixed: `PATCH /work-orders/:id/assign` no tech-role validation — could assign to customers
- [x] Verified: all valid/invalid status transitions enforced (VALID_TRANSITIONS + moderator-only cancel)
- [x] Verified: ownership guard — customers see own orders, technicians see assigned, moderators see all
- [x] Verified: refresh token rotation invalidates old tokens
- [x] Verified: rate limiting on auth endpoints
- [x] Verified: unauthenticated requests blocked (401) across all guarded endpoints

**Exit criteria:** All 41 tests pass · 2 security bugs fixed

---

## Cross-Cutting
- [x] Profile editing (name, avatar, password) — all roles
- [x] Avatar upload via AWS S3 (external service marked `Hardcoded:`)
- [x] Customer order creation (backend + frontend)
- [x] Moderator user management (edit, ban, delete)
- [x] Profile nav item visible to all roles
- [x] `Hardcoded:` comments on all hardcoded values and external services
- [x] API test suite: 41 endpoint tests passing
