# Marketing & SEO Todo

> Generated from SEO audit — 2026-04-06
> Priority order reflects Google indexability impact.

---

## Sprint 1 — Foundational Indexability

- [x] **Create `app/robots.ts`** — disallow `/admin`, `/api`; declare sitemap URL
- [x] **Create `app/sitemap.ts`** — include all public pages + dynamic `/workshops/[slug]` routes
- [x] **Remove `force-dynamic` from `app/layout.tsx:1`** — enables ISR/static rendering
- [x] **Add `generateMetadata` to `app/workshops/[slug]/page.tsx`** — use `category.name`, `category.description`, `category.imageUrl` for title/OG
- [x] **Add `robots: { index: false, follow: false }` to transactional pages:**
  - `app/(site)/reserve/success/page.tsx`
  - `app/(site)/reserve/cancel/page.tsx`
  - `app/(site)/gift-voucher/success/page.tsx`
  - `app/(site)/maintenance/page.tsx`

---

## Sprint 2 — Metadata Completeness

- [x] **Update root layout metadata** (`app/layout.tsx:13-16`) — add brand name, location, and `title.template: '%s | Giftoria Workshops'`
- [x] **Fix `app/faq/page.tsx`** — remove `"use client"` from the page file (keep it only in the accordion child component); export `metadata` with title, description, and canonical
- [x] **Add metadata to static pages missing it:**
  - `app/contact/page.tsx`
  - `app/(site)/privacy-policy/page.tsx`
  - `app/(site)/refund/page.tsx`
- [x] **Add `alternates.canonical` to homepage** (`app/(site)/page.tsx`)
- [x] **Add canonical + OG tags to gift-voucher page** (`app/(site)/gift-voucher/page.tsx`)
- [x] **Fix homepage OG locale** — convert static `metadata` export to `generateMetadata` and resolve locale dynamically (EN → `en_GB`, NL → `nl_NL`, TR → `tr_TR`)

---

## Sprint 3 — Structured Data (JSON-LD Rich Results)

- [x] **Add `Event` JSON-LD to `/workshops/[slug]`** — enables rich event cards in Google Search; include `name`, `startDate`, `location`, `offers`, `organizer`
- [x] **Add `FAQPage` JSON-LD to `/faq`** — expands FAQ answers directly in SERP
- [x] **Add `LocalBusiness` JSON-LD to homepage** — improves local search presence and Google Knowledge Panel; include `name`, `address`, `telephone`, `openingHours`, `url`
- [ ] **Add `BreadcrumbList` JSON-LD** to pages that already render breadcrumb `<nav>` elements:
  - `app/(site)/reserve/page.tsx:17`
  - `components/workshop/WorkshopDetail.tsx:53`
  - `app/(site)/gift-voucher/page.tsx:21`

---

## Sprint 4 — Core Web Vitals

- [x] **Convert hero/card images to `next/image`** — LCP and CLS improvements:
  - `components/workshop/WorkshopDetail.tsx:74` — workshop hero image (add `priority` prop, it is above-the-fold)
  - `app/(site)/page.tsx:308` — homepage category cards
  - `components/Slider.tsx:105` — gallery slider
  - `components/reservation/ReservationFlow.tsx:150`
  - `app/layout.tsx:36`
  - Add `remotePatterns` in `next.config.mjs` for any external image domains
- [x] **Add OG images to key pages** — create a static `/public/og-default.png` (1200×630) and wire it to root layout; generate per-category OG images using `next/og` for `/workshops/[slug]`

---

## Sprint 5 — International SEO

- [x] **Add `hreflang` tags** to root layout for EN/NL/TR variants
  - Preferred: implement URL-based locale routing (`/en/`, `/nl/`, `/tr/`) so hreflang links are unambiguous
  - Fallback: add `alternates.languages` to root metadata if URL routing is not feasible
- [ ] **Add `altText` field to `CategoryPhoto` Prisma model** — allows admin to set descriptive alt text per gallery photo instead of generic `"Event photo 1"`
- [x] **Update `Slider.tsx:181`** — replace `"Preview ${n}"` alt text with descriptive fallback using category name context

---

## Notes

- All canonical URLs must use `process.env.NEXT_PUBLIC_APP_URL` — never hardcode the domain.
- Metadata on pages with `"use client"` is impossible in Next.js 14 — always split interactive logic into a child client component and keep the page file as a Server Component.
- `next/image` requires `remotePatterns` config for any external image hostname (uploaded images in `/public/uploads` are local and need no extra config).
