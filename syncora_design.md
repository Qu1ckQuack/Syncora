# Syncora Dashboard — Design Notes v2

---

## Logo

- **File**: `components/shared/Logo.tsx`
- **Icon**: Custom SVG — purple (`#7B2FF7`) rounded square with compass/crosshair design
- **Text**: "**Sync**" (bold purple) + "**ora**" (light gray slate)
- **Size variants**: `xs` (20px), `sm` (24px), `md` (32px), `lg` (40px), `xl` (56px)
- **Props**: `size`, `showText`, `className`

---

## Color & Token System

### Brand palette
- **Primary**: `#7B2FF7` (syncora-500)
- Full ramp: syncora-50 → syncora-950 defined in `tailwind.config.ts`

### Theme tokens (CSS custom properties in `globals.css`)
All values use `hsl(var(--...))` for dark mode composability.

| Token | Purpose |
|-------|---------|
| `--background` / `--foreground` | Page bg + default text |
| `--card` | Raised surface bg |
| `--muted` / `--muted-foreground` | Subtle fills + secondary text |
| `--accent` | Hover/active fill |
| `--border` | Default border |
| `--sidebar` / `--sidebar-border` | Sidebar surface + divider |
| `--topbar` / `--topbar-border` | Topbar surface + divider |

### Semantic status tokens ← new
Defined in `globals.css` and aliased in `lib/tokens.ts`. All status colors use these — never hardcode hex values in components.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-status-active` | emerald-600 | emerald-400 | In progress jobs |
| `--color-status-pending` | amber-600 | amber-400 | Awaiting assignment |
| `--color-status-transit` | blue-600 | blue-400 | Technician en route |
| `--color-status-done` | green-700 | green-400 | Completed |
| `--color-status-alert` | red-600 | red-400 | Urgent / delayed |
| `--color-status-offline` | gray-400 | gray-500 | Technician offline |

### Dark mode
- Toggle class: `.dark` on `<html>` via `theme-provider.tsx`
- Stored in `localStorage` key `syncora-theme`
- Components: Radix UI primitives + Tailwind CSS + `class-variance-authority` + `cn()`

---

## Pages

### Login (`/login`)

| Element | Detail |
|---------|--------|
| Layout | Full-screen centered, gradient bg (syncora-50 → white / dark: syncora-950 → black) |
| Card | `max-w-sm`, contains Logo + "Sign in to your account" |
| Form | Email + Password inputs with labels, full-width purple "Sign In" button |
| Error | Red `Alert` (destructive variant) with `AlertCircle` icon |
| Footer | "Haven't created an account yet? **Register**" → `/register` |
| Hint | Small demo account emails at bottom |
| A11y | `autoComplete="email"` / `"current-password"`, `aria-describedby` on error alert |

### Register (`/register`)

| Element | Detail |
|---------|--------|
| Layout | Same as Login |
| Form | Full Name + Email + Password (min 6 chars) |
| Submit | "Create Account" button |
| Footer | "Already have an account? **Sign In**" → `/login` |
| Role | Auto-assigned `"user"` on backend |

---

## Dashboard Shell

### Layout (`/dashboard`)

| Region | Component | Detail |
|--------|-----------|--------|
| Wrapper | `ThemeProvider` + `AuthGuard` | Theme + auth gate |
| Left | `DesktopSidebar` | `w-60`, hidden on mobile, border-right |
| Right | `TopBar` + `<main>` | Sticky header + scrollable content |

### TopBar

- Hamburger (mobile only) opens `MobileSidebar` Sheet
- Search bar (hidden on mobile): "Search orders, customers, technicians…"
- Notification bell with red dot badge + `aria-label="X unread notifications"`
- Refresh button with `aria-label="Refresh dashboard"`
- Theme toggle: light/dark switch pill
- **"Last updated X seconds ago"** label — refreshes every 30 s, resets on WebSocket event ← new

### Sidebar

- **Top**: Logo
- **Nav items** (role-filtered from `lib/roles.ts`):

| Item | Icon | Roles | Badge |
|------|------|-------|-------|
| Overview | `LayoutDashboard` | moderator, technician | — |
| Work Orders | `ClipboardList` | all | pending count |
| People | `Users` | moderator only | — |
| System Settings | `Settings` | moderator only | — |
| Profile | `UserCircle` | user only | — |

- **Active state**: syncora-600 bg + white text + left accent bar (3px)
- **Bottom**: Avatar + name/role + logout (moderator); `RoleSwitcher` dev-only tabs
- **Variants**: `DesktopSidebar` (`lg:flex`), `DesktopSidebarCollapsed` (icons only, `xl:flex`), `MobileSidebar` (Sheet drawer)
- **Keyboard nav**: all items reachable by Tab, Enter/Space activates, `aria-current="page"` on active item

### Breadcrumbs ← new
- **Component**: `Breadcrumbs.tsx` — shown on all pages except Overview
- **Format**: Overview › Work Orders › #SYN-1042
- **Behavior**: auto-generated from route segments via `useBreadcrumbs()` hook
- **Accessibility**: `<nav aria-label="Breadcrumb">` wrapping `<ol>` with `aria-current="page"` on last item

---

## Real-time System ← new

### Transport
- **Protocol**: WebSocket via `lib/socket.ts` (`useSocket()` hook)
- **Fallback**: SSE polling every 15 s if WS unavailable
- **Connection indicator**: small colored dot in TopBar — green (connected), amber (reconnecting), red (disconnected)

### Toast / Snackbar system
- **Component**: `ToastProvider` wrapping entire app (Radix `Toast` primitive)
- **Position**: bottom-right, `z-50`
- **Auto-dismiss**: 5 s default, 10 s for urgent (red) toasts
- **Types & icons**:

| Type | Color | Icon | Trigger |
|------|-------|------|---------|
| Job assigned | blue | `Bell` | new order dispatched to technician |
| En route | blue | `Navigation` | technician starts travel |
| Delay alert | red | `AlertTriangle` | technician >10 min late |
| Job completed | green | `CheckCircle` | technician marks done |
| System error | red | `XCircle` | API / socket failure |

- **Action**: each toast has an optional "View" CTA that deep-links to the relevant order
- **Persistence**: toasts also append to the `AlertsPanel` history list

### Live table row updates
- Rows that receive a status change flash with a 600 ms `bg-syncora-50 → transparent` CSS transition
- New rows slide in from top with `animate-slide-down` (150 ms ease-out)
- Deleted/completed rows fade out with `animate-fade-out` (300 ms)

### Skeleton states
- All data-fetching components render `<Skeleton>` placeholders on first load
- Skeletons match the exact shape of the real content (same height, columns, avatar size)
- Defined in `components/ui/skeleton.tsx` using `animate-pulse`

---

## Status Pills ← updated

All status pills use **icon + color** (never color alone — WCAG 2.1 AA).

```tsx
// StatusPill.tsx
<Badge variant={status}>
  <StatusIcon status={status} size={12} aria-hidden />
  {label}
</Badge>
```

| Status | Icon | Token |
|--------|------|-------|
| In progress | `Loader2` (spinning) | `--color-status-active` |
| Pending | `Clock` | `--color-status-pending` |
| En route | `Navigation` | `--color-status-transit` |
| Completed | `CheckCircle2` | `--color-status-done` |
| Delayed | `AlertTriangle` | `--color-status-alert` |
| Offline | `WifiOff` | `--color-status-offline` |

---

## Dashboard Pages

### Overview (`/dashboard/overview`)

| Component | Layout | Detail |
|-----------|--------|--------|
| `StatCards` | 4-col grid (1→2→4) | Active Jobs (syncora accent — hero card), Pending Alerts (amber), Online Technicians (emerald), Completions Today (violet). Each: 36px value, trend % arrow, sparkline |
| **Hero card** | First card | Active Jobs uses syncora-500 bg + white text to anchor visual hierarchy ← new |
| `JobTable` | `xl:col-span-2` | Order ID, Customer, Technician (avatar+name), Work Type, Location, Date, StatusPill, View button |
| `TechnicianMap` | Sidebar | See Map section |
| `AlertsPanel` | Sidebar | `aria-live="polite"` region, 280px scroll, colored left-border per type |

**Visual hierarchy rule**: stat cards → job table → panels. Each level uses smaller type and lower contrast than the level above it.

### Work Orders (`/dashboard/work-orders`)

**Moderator / Technician — desktop:**

| Component | Layout | Detail |
|-----------|--------|--------|
| Filter bar | Full width | Status pills as toggle filters + date range picker + search |
| `JobTable` | `xl:col-span-3` | Full table with inline status actions |
| `AlertsPanel` | Sidebar | Alert list |

**Technician — mobile (≤767px):** ← new

| Component | Detail |
|-----------|--------|
| `JobCardStack` | Swipeable vertical stack of `JobCard` components — one card per job |
| `JobCard` | Large tap targets (min 48px). Shows: order ID, customer name, work type, location with map pin, arrival time, StatusPill. CTA: "Navigate" (opens Maps) + "Update status" |
| Active job | Pinned to top, full-width, syncora accent border |
| Swipe right | Mark step complete |
| Swipe left | Flag an issue / request support |

**User:**

| Component | Layout | Detail |
|-----------|--------|--------|
| `ProgressTracker` | `lg:col-span-3` | Step progress: Received → Assigned → En Route → In Progress → Completed. Progress bar + ETA + technician avatar + name |
| `OrderTrackingMap` | Sidebar | See Map section |
| `AlertsPanel` | Sidebar | Alert list |

### People (`/dashboard/people`)

| Element | Detail |
|---------|--------|
| Access | Moderator only |
| Search | Debounced 300 ms, filters by name or ID |
| Card row | Avatar, Name, Tech ID + order count, Online/Offline `StatusPill`, "View profile" button |
| Empty state | "No technicians found" illustration + "Clear search" CTA |

### Settings (`/dashboard/settings`)

| Element | Detail |
|---------|--------|
| Access | Moderator only |
| Card 1 | Notifications — 4 toggle switches with label + description each |
| Card 2 | Access Control — Moderator / Technician / User rows with Edit button |

---

## Map Component ← updated

| Variant | Used on | Implementation |
|---------|---------|---------------|
| `TechnicianMap` | Overview sidebar | **Sprint 1**: decorative CSS grid + pulsing dots (placeholder — see below). **Sprint 2**: Mapbox GL JS with real-time technician coordinates via WS |
| `OrderTrackingMap` | Customer work orders | **Sprint 1**: decorative route line + ETA badge placeholder. **Sprint 2**: Mapbox with polyline route, animated technician marker, destination pin |

> ⚠️ **Placeholder notice**: Both map components render a `data-placeholder="true"` attribute in Sprint 1 and display a "Live map coming soon" watermark in development builds. Storybook stories are marked `[PLACEHOLDER]`. Do not ship decorative maps to production without the Mapbox integration.

**Sprint 2 map spec:**
- Library: Mapbox GL JS (`mapbox-gl` npm package)
- Style: `mapbox://styles/mapbox/light-v11` (light) / `dark-v11` (dark) — respects `syncora-theme`
- Technician markers: custom SVG pins with avatar initials + pulse ring animation when moving
- "Last position updated X min ago" label on each pin

---

## Empty States ← new

Defined in `components/empty-states/`. Each uses a centered illustration (Lottie or SVG), heading, subtext, and optional CTA.

| State | Trigger | Heading | CTA |
|-------|---------|---------|-----|
| `EmptyJobs` | Job table has 0 rows | "No active jobs right now" | "Create order" (moderator) / "Check back soon" (user) |
| `EmptyTechnicians` | 0 technicians online | "All technicians are offline" | "View team" → People page |
| `NetworkError` | API / WS failure | "Couldn't load data" | "Retry" button (triggers refetch) |
| `EmptyAlerts` | 0 alerts | "You're all caught up" | — |
| `EmptySearch` | Search returns 0 results | "No results for '…'" | "Clear search" |

---

## Accessibility ← new

- **Standard**: WCAG 2.1 AA minimum
- **Focus rings**: `focus-visible:ring-2 focus-visible:ring-syncora-500 focus-visible:ring-offset-2` on all interactive elements — defined as global Tailwind base style
- **Color**: no information conveyed by color alone — all status pills, badges, and alerts use icon + color
- **Live regions**:
  - `AlertsPanel`: `aria-live="polite"` — announces new alerts without interrupting
  - Toast container: `aria-live="assertive"` for urgent (red) toasts only
- **Navigation**: `<nav aria-label="Main navigation">` on sidebar, `<nav aria-label="Breadcrumb">` on breadcrumbs
- **Tables**: `<th scope="col">` on all column headers, `aria-sort` on sortable columns
- **Modals / Sheets**: focus trapped on open, returns to trigger on close (`@radix-ui/react-dialog` handles this)
- **Images / icons**: decorative icons get `aria-hidden="true"`, meaningful icons get `aria-label`
- **Reduced motion**: all animations respect `prefers-reduced-motion: reduce` — transitions set to `0ms` via global CSS

---

## Component Library

- **Primitives**: Radix UI
- **Styling**: Tailwind CSS + `class-variance-authority` + `cn()` utility
- **Animation**: Tailwind `animate-*` + `tailwindcss-animate` plugin
- **Icons**: `lucide-react`
- **Toasts**: `@radix-ui/react-toast` via shadcn `Toaster`
- **Maps**: `mapbox-gl` (Sprint 2)
- **Storybook**: all components documented with light/dark/mobile/empty-state stories
