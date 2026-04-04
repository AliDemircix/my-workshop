# Security TODO

Generated from security audit on 2026-04-04.

## HIGH

- [x] **Leak: DeepL error detail in translate API response**
  - File: `app/api/admin/translate/route.ts`
  - Fix: Return generic error; raw DeepL response logged server-side only.

- [x] **Missing HTTP security headers**
  - File: `next.config.mjs`
  - Fix: Added `headers()` export with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`.

- [x] **Leak: Stripe checkout error messages forwarded to client**
  - File: `app/api/stripe/checkout/route.ts`
  - Fix: Generic error returned to client; real error logged server-side.

## MEDIUM

- [x] **Translate endpoint missing input validation**
  - File: `app/api/admin/translate/route.ts`
  - Fix: Zod schema added — `targetLang` allowlist (12 codes), text length capped at 5000 chars.

- [x] **Admin cookie missing `path: '/'`**
  - File: `app/admin/login/page.tsx`
  - Fix: `path: '/'` added to cookie options.

- [x] **Webhook email body not HTML-escaped**
  - File: `app/api/stripe/webhook/route.ts`
  - Fix: `escapeHtml()` helper added and applied to all user-supplied fields in email templates.

- [x] **No reservation status check before Stripe checkout**
  - File: `app/api/stripe/checkout/route.ts`
  - Fix: Returns 409 if `reservation.status !== 'PENDING'`.

## LOW

- [x] **No Zod validation on `/api/availability`**
  - File: `app/api/availability/route.ts`
  - Fix: Zod schema added — coerces and validates `categoryId`, `month` (0–11), `year` (2020–2100).

- [ ] **File upload extension derived from client-supplied filename**
  - File: `app/api/admin/upload/route.ts:38`
  - Fix: Derive extension from validated MIME type, not the original filename.

- [x] **`SMTP_TLS_REJECT_UNAUTHORIZED` missing danger warning**
  - File: `.env.example`
  - Fix: Added `DANGER:` comment warning against production use.

## INFO

- [x] **Default admin credentials not blocked in production**
  - File: `lib/env.ts`
  - Fix: Changed to `throw new Error(...)` when `NODE_ENV === 'production'` and credentials are still `admin`/`admin`.

- [ ] **35 npm dependency vulnerabilities (1 critical)**
  - Fix: `npm audit fix` run — critical/high resolved. 7 remaining require breaking upgrades:
    - `nodemailer` → `v8` (breaking): needs migration review before upgrading
    - `react-quill` / `quill` (moderate XSS): no non-breaking fix available; mitigated by `sanitize-html` on DB write

- [ ] **Admin auth is cookie-value-only (`=== '1'`), no session invalidation**
  - File: `middleware.ts`, `lib/auth.ts`
  - Fix: Replace with NextAuth.js or a signed JWT with a server-side session store before multi-user production use.
