# context.md — Syncora Project Context

## What Is Syncora

Syncora is a secure, real-time work-order management platform built for field-service operations. It enables moderators to dispatch and monitor jobs, technicians to receive and update assignments in the field, and customers to track service progress live.

---

## User Roles

| Role | Responsibilities |
|------|-----------------|
| **MODERATOR** | Full platform access. Creates and assigns work orders, manages technicians and users, views system-wide analytics and alerts. |
| **TECHNICIAN** | Receives assigned jobs, updates job status in the field, navigates to job sites. Primary interface is mobile. |
| **CUSTOMER** | Tracks progress of their own work orders only. Views technician ETA, job status, and receives notifications. |

Role access is enforced at both the API (NestJS Guards) and UI (sidebar nav, route guards) levels.

---

## MVP Scope

**Included:**
- Authentication (registration, login, JWT + refresh tokens)
- Role-based access control (RBAC)
- Work order lifecycle management
- Operational dashboard
- Notification system
- Real-time status updates via WebSocket

**Excluded from MVP:**
- Billing and invoicing
- Inventory management
- AI features
- Multi-tenant support
- Offline sync
- External ERP integrations

**Target outcome:** An operational field-service platform ready for internal production use.

---

## System Priorities

1. Security
2. Reliability
3. Maintainability
4. Real-time communication
5. User experience

---

## Design Identity

- **Brand color**: `#7B2FF7` (syncora-500 — purple)
- **Logo**: Compass/crosshair SVG icon + "**Sync**ora" wordmark
- **Theme**: Light/dark with CSS custom property tokens, toggled via `.dark` class on `<html>`
- **Component base**: Radix UI primitives + Tailwind CSS + shadcn/ui
- **Accessibility standard**: WCAG 2.1 AA minimum

---

## Key Pages

| Page | Roles | Purpose |
|------|-------|---------|
| `/login` | All | Authentication entry |
| `/register` | All | Account creation |
| `/dashboard/overview` | Moderator, Technician | Live KPI cards, job table, map, alerts |
| `/dashboard/work-orders` | All | Full order list; mobile card stack for technicians; progress tracker for customers |
| `/dashboard/people` | Moderator | Technician roster and status |
| `/dashboard/settings` | Moderator | Notifications config, access control |
