# Customize App Feature

Turn the workshop reservation app into a configurable platform that can be deployed for any workshop business with different branding, layout, and business rules — all managed from the admin panel without code changes.

## Architectural Decisions

- **DB-driven config over env vars** — `SiteSettings` changes apply instantly without redeploys. Secrets stay in env vars.
- **JSON fields on `SiteSettings`** for complex config (hero, booking rules, section order) — avoids migration churn.
- **Tailwind CSS custom properties** — replace hardcoded colors/fonts with CSS vars in `tailwind.config.ts`.
- **Preset layouts, not a drag-and-drop builder** — 2-3 curated presets per section. No full builder.

---

## Sprint 1 — Brand Color System & Visual Identity

**Goal:** A new deployment can look like a completely different brand by changing colors, fonts, logo, and favicon from the admin panel.

### Tickets

#### CUST-01 — Brand Color System via CSS Custom Properties
- Add `primaryColor`, `secondaryColor`, `accentColor`, `textColor`, `bgColor` fields to `SiteSettings` (hex strings, default to current gold `#c99706` palette)
- Update `tailwind.config.ts` to define a `brand` color palette using CSS custom properties (`--color-primary`, etc.)
- Add a `<style>` tag in the root layout (`app/layout.tsx`) that injects `--color-primary: {primaryColor}` etc. from `SiteSettings`
- Replace all hardcoded color classes (`bg-[#c99706]`, `text-[#c99706]`) across the codebase with `bg-brand-primary`, `text-brand-primary` etc.
- Add a color picker UI to `/admin/settings/branding`
- **Files:** `prisma/schema.prisma`, `tailwind.config.ts`, `app/layout.tsx`, `app/admin/settings/branding/page.tsx`, all public components
- **Migration:** Add new columns with defaults matching current gold palette

#### CUST-02 — Font Selection Presets
- Add `fontPreset` field to `SiteSettings` (enum: `'modern'|'classic'|'minimal'`, default `'modern'`)
- Map each preset to a Google Fonts import + CSS variable pair in `app/layout.tsx`
- `modern` = Inter (current), `classic` = Playfair Display + Lato, `minimal` = DM Sans
- Add font preset selector (radio cards with preview) to `/admin/settings/branding`
- **Files:** `prisma/schema.prisma`, `app/layout.tsx`, `app/admin/settings/branding/page.tsx`

#### CUST-03 — Favicon & OG Image Upload
- Add `faviconUrl` and `ogImageUrl` fields to `SiteSettings`
- Update `app/layout.tsx` metadata export to read `faviconUrl` and `ogImageUrl` from DB
- Add upload controls in `/admin/settings/branding` using existing `CategoryImageUploader` component
- **Files:** `prisma/schema.prisma`, `app/layout.tsx`, `app/admin/settings/branding/page.tsx`

---

## Sprint 2 — Business Identity & Email Branding

**Goal:** Business name, tagline, contact details, and all outgoing emails reflect the specific workshop business.

### Tickets

#### CUST-04 — Business Identity Fields
- Add `businessName`, `tagline`, `vatNumber` fields to `SiteSettings`
- `businessName` replaces hardcoded "Giftoria Workshop" strings across all pages, emails, and structured data
- `tagline` used in hero section and `<meta name="description">`
- Grep and replace all hardcoded business name instances: homepage, footer, email templates, JSON-LD structured data
- **Files:** `prisma/schema.prisma`, `app/admin/settings/contact/page.tsx`, all templates/pages with hardcoded name

#### CUST-05 — Email Branding Tokens
- Add `emailAccentColor`, `emailFooterText`, `emailLogoUrl` fields to `SiteSettings` (defaults fall back to `primaryColor` / `logoUrl`)
- Update all email templates in `lib/mailer.ts` to use these tokens instead of hardcoded values
- Preview rendered HTML in admin at `/admin/settings/branding`
- **Files:** `prisma/schema.prisma`, `lib/mailer.ts`, `app/admin/settings/branding/page.tsx`

#### CUST-06 — Payment & Locale Config
- Add `currency` (ISO 4217, e.g. `EUR`), `currencySymbol` (`€`), `vatRate` (float, e.g. `0.21`), `countryCode` (`NL`) fields to `SiteSettings`
- Replace hardcoded `EUR` in Stripe checkout creation (`app/api/stripe/`) and all price display components
- Replace hardcoded VAT rate in reservation/gift card flows
- Add new admin page `/admin/settings/locale` with currency + VAT fields
- **Files:** `prisma/schema.prisma`, `app/api/stripe/checkout/route.ts`, price display components, `app/admin/settings/`

---

## Sprint 3 — Feature Flags

**Goal:** Unused features are invisible to visitors. Each deployment only shows what's relevant.

### Tickets

#### CUST-07 — Feature Flag Infrastructure
- Add boolean fields to `SiteSettings`: `enableWaitlist`, `enableGiftVouchers`, `enableNewsletter`, `enablePrivateEvents`, `enableReviews`, `enableFAQ`, `enablePromoCode`
- Create `lib/features.ts` — `getFeatureFlags()` function that fetches `SiteSettings` row and returns typed flag object, cached with `unstable_cache` (1 min TTL)
- All flags default to `true` (no behavior change on migration)
- **Files:** `prisma/schema.prisma`, `lib/features.ts` (new)

#### CUST-08 — Apply Feature Flags to Public Pages & API
- Homepage: conditionally render gift voucher CTA, newsletter section, private events section, FAQ, testimonials using `getFeatureFlags()`
- Reservation flow: hide waitlist join button when `enableWaitlist = false`
- API routes: return `404` for disabled features (`/api/gift-cards`, waitlist endpoints)
- Admin nav: hide menu items for disabled features
- **Files:** `app/(site)/page.tsx`, `app/(site)/reserve/`, `app/api/`, `components/admin/AdminNav.tsx`

#### CUST-09 — Feature Flags Admin UI
- Add admin page `/admin/settings/features` with toggle switches for each flag
- Group toggles: Booking (waitlist, promo codes), Marketing (gift vouchers, newsletter, private events), Content (reviews, FAQ)
- Save via Server Action, revalidate homepage and relevant paths
- **Files:** `app/admin/settings/features/page.tsx` (new), `app/admin/settings/actions.ts`

---

## Sprint 4 — Hero & Homepage Layout Config

**Goal:** The homepage hero and section layout can be customized without touching code.

### Tickets

#### CUST-10 — Hero Section Config
- Add `heroConfig` JSON field to `SiteSettings` with shape: `{ headline, subtext, ctaLabel, ctaUrl, bgImageUrl, overlayOpacity }`
- Validate with Zod schema in a shared `lib/config-schemas.ts`
- Update homepage hero component to read from `heroConfig` instead of hardcoded strings
- Add `/admin/settings/hero` page with form fields + image uploader
- Fallback to sensible defaults if `heroConfig` is null
- **Files:** `prisma/schema.prisma`, `lib/config-schemas.ts` (new), `app/(site)/page.tsx`, `app/admin/settings/hero/` (new)

#### CUST-11 — Homepage Section Ordering
- Add `homepageSections` JSON field to `SiteSettings`: ordered array of section keys, e.g. `["hero","categories","testimonials","faq","private-events","newsletter"]`
- Homepage maps over this array and renders sections in order, skipping sections disabled by feature flags
- Add `/admin/settings/layout` page with a drag-to-reorder list (use `@dnd-kit/sortable`)
- **Files:** `prisma/schema.prisma`, `app/(site)/page.tsx`, `app/admin/settings/layout/` (new)

#### CUST-12 — Navigation Links Config
- Add `navLinks` JSON field to `SiteSettings`: array of `{ label, href, openInNewTab }` objects
- Header component reads from `navLinks` instead of hardcoded nav items
- Add `/admin/settings/navigation` page with add/remove/reorder link editor
- **Files:** `prisma/schema.prisma`, `components/Header.tsx` (or equivalent), `app/admin/settings/navigation/` (new)

---

## Sprint 5 — Booking Rules & Locale

**Goal:** Booking constraints and language options are configurable per deployment.

### Tickets

#### CUST-13 — Booking Rules Config
- Add `bookingRules` JSON field to `SiteSettings` with Zod-validated shape: `{ minGroupSize, maxGroupSize, advanceBookingDays, cancellationWindowHours, cancellationPolicyText }`
- Apply `minGroupSize`/`maxGroupSize` validation in `POST /api/reservations` (Zod schema)
- Apply `advanceBookingDays` filter in `GET /api/availability` (exclude sessions too far in future if limit set)
- Apply `cancellationWindowHours` check in cancellation flow
- Show `cancellationPolicyText` in reservation confirmation page and email
- Add `/admin/settings/booking-rules` page
- **Files:** `prisma/schema.prisma`, `lib/config-schemas.ts`, `app/api/reservations/route.ts`, `app/api/availability/route.ts`, `app/admin/settings/booking-rules/` (new)

#### CUST-14 — Locale & Language Config
- Add `enabledLocales` JSON field (string array) and `defaultLocale` string to `SiteSettings`
- Update `i18n/request.ts` to read `enabledLocales` and `defaultLocale` from DB (with fallback to `['nl','en','tr']` / `'nl'`)
- Update `LanguageSwitcher` component to only render enabled locales
- Add locale config fields to `/admin/settings/locale` (Sprint 2 page, extend it)
- **Files:** `prisma/schema.prisma`, `i18n/request.ts`, `components/LanguageSwitcher.tsx`, `app/admin/settings/locale/page.tsx`

---

## Sprint 6 — Multi-Tenant Foundation (Future / Out of Scope for Now)

Placeholder for when the app needs to serve multiple independent workshop businesses from one deployment.

- `Tenant` model with domain/subdomain mapping
- Middleware resolves tenant from `Host` header
- All queries filter by `tenantId`
- `SiteSettings` becomes per-tenant
- Stripe Connect for per-tenant payment accounts
- **Complexity:** Very High — do not start until Sprints 1-5 are stable and validated

---

## File Index

| File | Touched In |
|------|-----------|
| `prisma/schema.prisma` | CUST-01 through CUST-14 |
| `tailwind.config.ts` | CUST-01 |
| `app/layout.tsx` | CUST-01, CUST-02, CUST-03 |
| `app/admin/settings/branding/page.tsx` | CUST-01, CUST-02, CUST-03, CUST-05 |
| `app/admin/settings/contact/page.tsx` | CUST-04 |
| `lib/mailer.ts` | CUST-05 |
| `app/api/stripe/checkout/route.ts` | CUST-06 |
| `lib/features.ts` (new) | CUST-07 |
| `app/(site)/page.tsx` | CUST-08, CUST-10, CUST-11 |
| `app/api/reservations/route.ts` | CUST-08, CUST-13 |
| `components/admin/AdminNav.tsx` | CUST-08 |
| `app/admin/settings/features/page.tsx` (new) | CUST-09 |
| `lib/config-schemas.ts` (new) | CUST-10, CUST-13 |
| `app/admin/settings/hero/` (new) | CUST-10 |
| `app/admin/settings/layout/` (new) | CUST-11 |
| `app/admin/settings/navigation/` (new) | CUST-12 |
| `app/api/availability/route.ts` | CUST-13 |
| `i18n/request.ts` | CUST-14 |
| `components/LanguageSwitcher.tsx` | CUST-14 |
| `app/admin/settings/locale/page.tsx` (new) | CUST-06, CUST-14 |
