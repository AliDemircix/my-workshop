# Features Roadmap — Giftoria Workshop Platform

> Generated: 2026-04-06
> Assigned to: Senior Developer (Ali Demirci)
> Based on architecture audit recommendations.

---

## Overview

| Sprint | Theme | Duration | Status |
|--------|-------|----------|--------|
| Sprint 1 | Data Integrity & Critical Fixes | 1 week | Planned |
| Sprint 2 | Customer Self-Service | 2 weeks | Planned |
| Sprint 3 | Admin Business Intelligence | 2 weeks | Planned |
| Sprint 4 | Booking Experience Upgrades | 2 weeks | Planned |
| Sprint 5 | Revenue Growth Features | 2 weeks | Planned |
| Sprint 6 | Reliability & Operations | 1 week | Planned |

---

## Sprint 1 — Data Integrity & Critical Fixes
> **Duration:** 1 week | **Priority:** Critical

These are active bugs or data integrity issues affecting the live system now.

### Tasks

- [ ] **FEAT-01** — Reservation expiry cleanup job
  - Create a `GET /api/cron/expire-reservations` endpoint that cancels PENDING reservations older than 30 min with no confirmed payment
  - Add `expiresAt DateTime?` to `Reservation` model and set it on creation (`createdAt + 30m`)
  - Update availability query in `GET /api/availability` to exclude expired reservations
  - Run via external cron (Vercel Cron Jobs / Railway cron) on a 15-minute interval
  - **Files:** `app/api/cron/expire-reservations/route.ts` (new), `app/api/availability/route.ts`, `prisma/schema.prisma`

- [ ] **FEAT-02** — Webhook dead-letter logging
  - Add `WebhookEvent` model: `{ id, stripeEventId, type, status, errorMessage?, payload Json, processedAt?, createdAt }`
  - In `POST /api/stripe/webhook`, write a log entry before processing and update status after
  - Add a read-only admin page at `app/admin/webhook-events/page.tsx` listing recent events with status badges
  - **Files:** `prisma/schema.prisma`, `app/api/stripe/webhook/route.ts`, `app/admin/webhook-events/page.tsx` (new)

---

## Sprint 2 — Customer Self-Service
> **Duration:** 2 weeks | **Priority:** High

Reduce admin workload and improve post-booking customer experience.

### Tasks

- [ ] **FEAT-03** — Customer self-service cancellation
  - Generate a signed cancellation token (HMAC-SHA256 of `reservationId + secret`) and include it in the confirmation email as a URL: `/reserve/manage?id=xxx&token=yyy`
  - Create page `app/(site)/reserve/manage/page.tsx` — shows booking details; cancel button if >48h before session
  - Cancellation triggers Stripe refund via `stripe.refunds.create` and sends confirmation email
  - Add `cancellationPolicy` field to `SiteSettings` for admin-configurable cutoff hours
  - **Files:** `app/(site)/reserve/manage/page.tsx` (new), `app/api/reservations/cancel/route.ts` (new), `lib/mailer.ts`, `prisma/schema.prisma`

- [ ] **FEAT-04** — Calendar ICS attachment in confirmation email
  - Generate `.ics` content (RFC 5545) from session `date`, `startTime`, `endTime`, `category.name`, and `location` from `SiteSettings`
  - Attach as `invite.ics` in the nodemailer options in `app/api/stripe/webhook/route.ts`
  - **Files:** `lib/mailer.ts`, `app/api/stripe/webhook/route.ts`

- [ ] **FEAT-05** — Reminder email 24h before session
  - Add a `GET /api/cron/send-reminders` endpoint
  - Query PAID reservations whose session date is tomorrow; check `reminderSentAt` is null
  - Send reminder email, set `reminderSentAt DateTime?` on the reservation
  - **Files:** `app/api/cron/send-reminders/route.ts` (new), `prisma/schema.prisma`, `lib/mailer.ts`

- [ ] **FEAT-06** — Phone number and notes on reservation
  - Add `phone String?` and `customerNotes String?` to `Reservation` model
  - Add fields to `ReserveForm.tsx` (phone required, notes optional textarea)
  - Pass fields through to `POST /api/reservations` and store them
  - Display in admin reservations table and detail view
  - **Files:** `prisma/schema.prisma`, `components/reservation/ReserveForm.tsx`, `app/api/reservations/route.ts`, `app/admin/reservations/page.tsx`

---

## Sprint 3 — Admin Business Intelligence
> **Duration:** 2 weeks | **Priority:** High

Give the admin visibility into revenue, occupancy, and business performance.

### Tasks

- [ ] **FEAT-07** — Revenue & occupancy dashboard
  - Replace the current stats row in `app/admin/page.tsx` with a proper dashboard layout
  - Add weekly/monthly revenue chart — aggregate `priceCents * quantity` for PAID reservations grouped by period (use a simple SVG line chart or install `recharts`)
  - Add per-category card: total bookings, total revenue, average fill rate
  - Add gift voucher revenue summary (sum `amountCents` from redeemed `GiftVoucher` records)
  - **Files:** `app/admin/page.tsx`, new `components/admin/RevenueChart.tsx`, `components/admin/CategoryStats.tsx`

- [ ] **FEAT-08** — CSV export for accounting
  - Add "Export CSV" button to `app/admin/reservations/page.tsx`
  - Generate CSV on the server with columns: date, session, category, customer name, email, phone, quantity, amount, status, voucher code used
  - Stream response with `Content-Disposition: attachment; filename="reservations-YYYY-MM.csv"`
  - **Files:** `app/api/admin/export/reservations/route.ts` (new), `app/admin/reservations/page.tsx`

- [ ] **FEAT-09** — Admin audit log
  - Add `AuditLog` model: `{ id, action, entityType, entityId, details Json?, createdAt }`
  - Log destructive/write actions: reservation cancelled, refund issued, session deleted, category deleted, settings saved
  - Create `lib/audit.ts` helper: `logAction(action, entityType, entityId, details?)`
  - Add read-only admin page `app/admin/audit-log/page.tsx`
  - **Files:** `prisma/schema.prisma`, `lib/audit.ts` (new), `app/admin/audit-log/page.tsx` (new), all admin server actions

---

## Sprint 4 — Booking Experience Upgrades
> **Duration:** 2 weeks | **Priority:** Medium

Improve conversion and operational efficiency in the booking flow.

### Tasks

- [ ] **FEAT-10** — Waitlist for sold-out sessions
  - Add `Waitlist` model: `{ id, sessionId, email, name, notifiedAt?, createdAt }`
  - When `remaining <= 0`, show "Notify me when a spot opens" button instead of disabled "Sold Out"
  - On cancellation/refund in the admin panel (and via self-service), check for waitlisted emails and send notification to the first N in queue
  - Admin view of waitlist entries per session in `app/admin/reservations/page.tsx`
  - **Files:** `prisma/schema.prisma`, `components/reservation/ReservationSidebar.tsx`, `app/api/waitlist/route.ts` (new), `app/admin/reservations/page.tsx`, `lib/mailer.ts`

- [ ] **FEAT-11** — Image gallery / lightbox in booking flow
  - In `WorkshopDetail.tsx`, replace the single hero image with a thumbnail strip + lightbox using `yet-another-react-lightbox` (small, no heavy deps)
  - In `ReservationFlow.tsx`, show a horizontal scrollable thumbnail row beneath the main image
  - **Files:** `components/workshop/WorkshopDetail.tsx`, `components/reservation/ReservationFlow.tsx`

- [ ] **FEAT-12** — Clone session in admin
  - Add "Duplicate" icon button to each row in the sessions table in `app/admin/workshops/page.tsx`
  - On click, open the Add Workshop dialog pre-filled with the selected session's category, time, capacity, and price — leaving only the date(s) empty
  - **Files:** `app/admin/workshops/page.tsx`

---

## Sprint 5 — Revenue Growth Features
> **Duration:** 2 weeks | **Priority:** Medium

New revenue levers and marketing capabilities.

### Tasks

- [ ] **FEAT-13** — Promo / discount codes
  - Add `PromoCode` model: `{ id, code, type (PERCENTAGE | FIXED_EUR), value, maxUses, usedCount, validFrom?, validUntil?, categoryId? }`
  - In `ReserveForm.tsx`, add a promo code input field alongside the existing voucher input
  - `POST /api/promo/validate` endpoint — returns discount amount or error
  - Apply discount on `POST /api/reservations` and create Stripe discount coupon via `stripe.coupons.create`
  - Admin CRUD at `app/admin/promo-codes/page.tsx`
  - **Files:** `prisma/schema.prisma`, `app/api/promo/validate/route.ts` (new), `app/api/reservations/route.ts`, `components/reservation/ReserveForm.tsx`, `app/admin/promo-codes/page.tsx` (new)

- [ ] **FEAT-14** — Group / private event inquiry form
  - Add a "Book a Private Event" CTA on the homepage and workshop detail pages
  - Create form page `app/(site)/private-event/page.tsx`: name, email, phone, group size, preferred date range, category, message
  - Add `PrivateEventRequest` model: `{ id, name, email, phone, groupSize, preferredDates, categoryId?, message, status (NEW | IN_PROGRESS | CLOSED), createdAt }`
  - Send admin notification email on new inquiry
  - Admin management page `app/admin/private-events/page.tsx`
  - **Files:** `prisma/schema.prisma`, `app/(site)/private-event/page.tsx` (new), `app/api/private-events/route.ts` (new), `app/admin/private-events/page.tsx` (new), `lib/mailer.ts`

- [ ] **FEAT-15** — Customer reviews linked to reservations
  - Add `Review` model: `{ id, reservationId, categoryId, name, rating Int (1-5), text, approved Boolean, createdAt }`
  - Schedule review request email 2 days after session date via the reminder cron job (FEAT-05)
  - Public review submission page via signed URL: `app/(site)/review/page.tsx`
  - Admin approval workflow in `app/admin/reviews/page.tsx`
  - Display approved reviews on `/workshops/[slug]` with star rating
  - Add `AggregateRating` JSON-LD to workshop detail page (SEO rich snippet)
  - **Files:** `prisma/schema.prisma`, `app/(site)/review/page.tsx` (new), `app/api/reviews/route.ts` (new), `app/admin/reviews/page.tsx` (new), `app/workshops/[slug]/page.tsx`, `lib/mailer.ts`

---

## Sprint 6 — Reliability & Operations
> **Duration:** 1 week | **Priority:** Low–Medium

Polish, multi-language consistency, and infrastructure hardening.

### Tasks

- [ ] **FEAT-16** — Multi-language emails and gift card names
  - Add `nameEn`, `nameTr`, `descriptionEn`, `descriptionTr` to `GiftCard` model (parallel to `Category`)
  - Extract email templates from `app/api/stripe/webhook/route.ts` into `lib/email-templates/` as locale-aware functions
  - Detect customer locale from the Stripe `metadata.locale` field (pass locale when creating the checkout session)
  - **Files:** `prisma/schema.prisma`, `lib/email-templates/` (new dir), `app/api/stripe/webhook/route.ts`, `app/api/reservations/route.ts`

- [ ] **FEAT-17** — API rate limiting
  - Add rate limiting middleware to public-facing API routes (`/api/reservations`, `/api/availability`, `/api/waitlist`, `/api/promo/validate`)
  - Use `@upstash/ratelimit` + Upstash Redis, or a simple in-memory sliding window for single-instance deployments
  - Return `429 Too Many Requests` with `Retry-After` header on breach
  - **Files:** `middleware.ts` or per-route wrapper, new `lib/rate-limit.ts`

- [ ] **FEAT-18** — `altText` field on `CategoryPhoto`
  - Add `altText String?` to `CategoryPhoto` model
  - Add alt text input to the photo upload UI in the admin category editor
  - Use `altText ?? category.name + " workshop photo"` as the `alt` prop in `Slider.tsx`
  - **Files:** `prisma/schema.prisma`, admin category editor, `components/Slider.tsx`

---

## Backlog (No Sprint Assigned)

- **Stripe Customer Portal** — store `stripeCustomerId` on a new `Customer` model; enable saved cards for repeat bookings
- **"My Bookings" page** — email magic link authentication for customers to view past reservations
- **Multi-admin support** — replace cookie auth with NextAuth.js; role-based access (owner / staff)
- **Mobile app push notifications** — post-booking and reminder push via a future React Native / PWA client

---

## Definition of Done

Each task is considered complete when:
1. Feature works end-to-end in development (`npm run dev`)
2. Prisma migration created and applied (`npm run prisma:migrate`)
3. No new ESLint errors (`npm run lint`)
4. Production build passes (`npm run build`)
5. Admin-facing changes are accessible only behind the `admin=1` cookie

---

## Notes

- All new API routes must validate input with Zod schemas.
- All rich-text inputs must be sanitized with `sanitize-html` before DB write.
- Canonical URLs must use `process.env.NEXT_PUBLIC_APP_URL` — never hardcode the domain.
- Cron endpoints must be protected with a secret header (`Authorization: Bearer CRON_SECRET`) to prevent public triggering.
