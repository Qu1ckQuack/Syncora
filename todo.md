# todo.md — Syncora Implementation Plan

Status legend: `[ ]` Planned · `[~]` In Progress · `[x]` Done · `[-]` Skipped / Deferred

---

## Phase 0 — Foundation
**Goal:** Schema changes, MODERATOR → HQ rename, DEALER role, new DB models.

### Database & Schema
- [x] Rename `MODERATOR` → `HQ` in Prisma `Role` enum
- [x] Add `DEALER` to Prisma `Role` enum
- [x] Add `Evidence` model: `id`, `workOrderId`, `technicianId`, `url`, `type` (PHOTO/VIDEO), `createdAt`
- [x] Add `Rating` model: `id`, `workOrderId`, `customerId`, `technicianId`, `score` (1-5), `comment`, `createdAt`
- [x] Add `Message` model: `id`, `conversationId`, `senderId`, `content`, `createdAt`
- [x] Add `Conversation` model: `id`, `workOrderId`, `participantIds`, `createdAt`
- [x] Add `phone`, `address` fields to User model
- [x] Write Prisma migration
- [x] Update seed script with DEALER user + all 4 roles

### Backend Rename (MODERATOR → HQ)
- [x] `auth/guards/roles.guard.ts` — rename MODERATOR → HQ
- [x] `auth/guards/ownership.guard.ts` — rename MODERATOR → HQ
- [x] `auth/decorators/roles.decorator.ts` — rename
- [x] `work-orders/work-orders.service.ts` — rename all MODERATOR refs
- [x] `work-orders/work-orders.controller.ts` — rename all MODERATOR refs
- [x] `work-orders/guards/work-order-ownership.guard.ts` — rename
- [x] `analytics/analytics.controller.ts` — rename
- [x] `analytics/analytics.service.ts` — rename
- [x] `users/users.controller.ts` — rename + add DEALER to @Roles() where appropriate
- [x] `users/users.service.ts` — rename
- [x] `locations/location.controller.ts` — rename + add DEALER
- [x] `ws/ws.gateway.ts` — rename
- [x] `upload/upload.controller.ts` — add DEALER
- [x] `notifications/notifications.controller.ts` — add DEALER

### Frontend Rename + Role Updates
- [x] `lib/types.ts` — Update `Role` type: `'HQ' | 'TECHNICIAN' | 'CUSTOMER' | 'DEALER'`; add `Rating`, `Evidence`, `Message` interfaces; add `IN_PROGRESS`, `CANCELLED` to `NotificationType`
- [x] `lib/auth-store.ts` — Update User role type
- [x] `lib/roles.ts` — Update nav items: HQ (replaces MODERATOR), add DEALER nav
- [x] `lib/status-transitions.ts` — Rename MODERATOR → HQ
- [x] `lib/socket-events.ts` — Add `PROOF_UPLOADED`, `RATING_SUBMITTED`, `DEALER_ASSIGNMENT`, `NEW_MESSAGE`
- [x] `components/layout/auth-guard.tsx` — Rename MODERATOR → HQ, add DEALER
- [x] `app/dashboard/map/map-view.tsx` — Rename MODERATOR → HQ
- [x] `app/dashboard/work-orders/page.tsx` — Rename MODERATOR → HQ
- [x] `app/dashboard/work-orders/[id]/page.tsx` — Rename MODERATOR → HQ
- [x] `app/dashboard/work-orders/new/page.tsx` — Rename MODERATOR → HQ
- [x] `app/dashboard/people/page.tsx` — Rename MODERATOR → HQ
- [x] `app/dashboard/settings/page.tsx` — Rename MODERATOR → HQ
- [x] `app/dashboard/analytics/page.tsx` — Rename MODERATOR → HQ

**Exit criteria:** Server starts, `Role` enum has `HQ | TECHNICIAN | CUSTOMER | DEALER`, seed creates users for all 4 roles, frontend nav works for each role.

---

## Phase 1 — Technician Accept/Decline
**Goal:** Technicians can accept or decline assigned work orders.

- [x] Backend: Add `ACCEPTED`, `DECLINED` to WorkOrderStatus enum
- [x] Backend: Update `VALID_TRANSITIONS` — `PENDING → ACCEPTED`, `PENDING → DECLINED`
- [x] Backend: Add `PATCH /work-orders/:id/accept` (role: TECHNICIAN, ownership guard)
- [x] Backend: Add `PATCH /work-orders/:id/decline` (role: TECHNICIAN, ownership guard)
- [x] Backend: On accept → audit log + notify HQ + customer
- [x] Backend: On decline → notify HQ, clear technicianId for reassignment
- [x] Frontend: `JobCard` / `JobCardStack` — Add Accept/Decline buttons for PENDING orders (technician)
- [x] Frontend: Work-order detail page — Add accept/decline UI for technician

**Exit criteria:** Technician sees Accept/Decline on pending orders. HQ notified on decision.

---

## Phase 2 — Technician Proof of Repair
**Goal:** Technicians can upload photo evidence during a job.

- [x] Backend: New `EvidenceModule` (`evidence.module.ts`, `evidence.controller.ts`, `evidence.service.ts`)
- [x] Backend: `POST /evidence` — Upload file (reuse S3 UploadService), attach to work order + technician
- [x] Backend: `GET /work-orders/:id/evidence` — List evidence for an order (role-filtered)
- [x] Backend: Socket emit `workOrder.evidenceAdded` on upload
- [x] Frontend: `useEvidence.ts` — TanStack Query hook for upload + list
- [x] Frontend: Work-order detail page — "Add Photo" button for technicians, file picker, progress indicator
- [x] Frontend: Photo gallery component showing all evidence for an order
- [x] Frontend: Real-time evidence update via socket event

**Exit criteria:** Technician can take/upload photos during a job. Photos stored in S3, linked to work order.

---

## Phase 3 — Customer Rating
**Goal:** Customers can rate the technician after job completion.

- [ ] Backend: New `RatingsModule` (`ratings.module.ts`, `ratings.controller.ts`, `ratings.service.ts`)
- [ ] Backend: `POST /ratings` — Create rating (customer, order must be COMPLETED, one per order)
- [ ] Backend: `GET /technicians/:id/ratings` — Aggregate ratings for technician profile
- [ ] Backend: Socket emit `rating.submitted` on new rating
- [ ] Frontend: Work-order detail after COMPLETED — Star rating UI for customers (1-5)
- [ ] Frontend: Technician profile page — Show average rating + review count
- [ ] Frontend: Real-time rating update via socket

**Exit criteria:** Customer can rate 1-5 stars with optional comment after job completion.

---

## Phase 4 — Customer Validate Proof
**Goal:** Customers can validate technician's proof photos.

- [ ] Backend: `PATCH /work-orders/:id/evidence/:evidenceId/validate` — Customer marks evidence as validated
- [ ] Backend: Notification to technician + HQ when validated
- [ ] Backend: Socket emit `evidence.validated` on validation
- [ ] Frontend: Work-order detail (customer view) — Photo gallery with "Validate" / "Request more" buttons
- [ ] Frontend: Toast when new evidence uploaded

**Exit criteria:** Customer sees proof photos, can mark them validated.

---

## Phase 5 — Technician Customer Data Access
**Goal:** Assigned technicians see full customer contact info.

- [ ] Backend: Expand customer select in work-order queries to include `phone`, `address` for technician role
- [ ] Backend: `GET /work-orders/:id/customer` — Dedicated customer info endpoint (technician, order must be assigned)
- [ ] Frontend: Work-order detail (technician view) — Add "Customer Info" card: name, phone, address, email
- [ ] Frontend: Call / SMS / Email action buttons (`tel:`, `mailto:`)

**Exit criteria:** Technician sees full customer contact info on assigned orders.

---

## Phase 6 — Dealer Role
**Goal:** Full dealer workflow — create order with product details, assign to HQ, track progress.

### Backend
- [ ] Add `DEALER` to all `@Roles()` guards where MODERATOR/TECHNICIAN are present (unless inappropriate)
- [ ] `work-orders.controller.ts` — Dealer-specific `POST /work-orders` (sets `assignedBy` = dealer ID)
- [ ] `create-work-order.dto.ts` — Add `dealerProductDetail`, `dueDate` fields
- [ ] `PATCH /work-orders/:id/assign-to-hq` — Dealer assigns order to a specific HQ coordinator
- [ ] `GET /work-orders` — Scope dealer to orders where `assignedBy` = dealer ID
- [ ] Notification to HQ on new dealer assignment (`DEALER_ASSIGNMENT`)
- [ ] Notification to dealer on status changes
- [ ] Socket events: `workOrder.dealerAssigned`, `workOrder.statusChanged` for dealers

### Frontend
- [ ] `roles.ts` — Add "Work Orders" + "New Order" nav items for DEALER
- [ ] Dealers see their own orders in work-orders list (scoped by `assignedBy`)
- [ ] Dealer order creation form — Product detail, due date, HQ coordinator select
- [ ] Dealer tracking view — Read-only status + proof photos + technician info

**Exit criteria:** Dealer logs in, creates order with product details + due date, assigns to HQ, tracks progress.

---

## Phase 7 — HQ Coordinator Enhancements
**Goal:** HQ gets dealer assignment notifications, DELAYED monitoring, and enhanced filtering.

- [ ] Backend: `GET /work-orders?source=dealer` — Filter by dealer-created orders
- [ ] Backend: Notification type `DEALER_ASSIGNMENT` for new dealer orders
- [ ] Backend: Emit `notification.dealerAssignment` to `role:HQ` room
- [ ] Frontend: HQ dashboard — "Dealer Assignments" section (pending dealer orders)
- [ ] Frontend: HQ work-orders page — Filter pill for "Dealer Created"
- [ ] Frontend: HQ overview — "DELAYED Orders" card with count + list
- [ ] Frontend: HQ map page — "Show DELAYED only" toggle

**Exit criteria:** HQ gets notified on new dealer orders, can view/filter/assign them, sees DELAYED orders highlighted.

---

## Phase 8 — Chat System
**Goal:** Real-time messaging between Dealer and HQ Coordinator.

### Backend
- [ ] `chat/chat.module.ts`, `chat.gateway.ts`, `chat.service.ts` — New WebSocket-based chat module
- [ ] Conversation room naming: `conversation:<orderId>`
- [ ] `@SubscribeMessage('chat.send')` — Receive + store message in DB + broadcast to room
- [ ] `@SubscribeMessage('chat.join')` — Join conversation room
- [ ] `@SubscribeMessage('chat.typing')` — Typing indicator broadcast
- [ ] `GET /conversations/:orderId` — Load message history
- [ ] Rate limit: 10 messages/second per user
- [ ] Authorization: only dealer + assigned HQ can join conversation for an order

### Frontend
- [ ] `useChat.ts` — Socket-based chat hook (send, receive, typing, history)
- [ ] `ChatPanel.tsx` — Slideover chat component: message list, input field, typing indicator, unread badge
- [ ] Add "Chat" button on work-order detail for dealer + HQ roles
- [ ] Unread message count badge on chat button + nav

**Exit criteria:** Dealer and HQ can exchange real-time messages linked to a work order.

---

## Cross-Cutting
- [ ] Docs: Update `context.md`, `architecture.md`, `development.md` for new roles
- [ ] Docs: Update `instruction.md` for new features
- [ ] Tests: Update test suite for new endpoints + roles
- [ ] Cleanup: Remove all deprecated MODERATOR references
