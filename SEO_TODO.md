# SEO TODO

Audit performed: 2026-04-07  
Site: https://workshop.giftoria.nl

---

## Critical

- [ ] **Create `og-default.png`** — `public/og-default.png` (1200×630px). Every social share from pages without a category image is currently broken/silent.
- [ ] **Add metadata to `/reserve`** — `app/(site)/reserve/page.tsx` has no `metadata` export or `generateMetadata`. Google sees no title or description.
- [ ] **Add `noindex` to `/review`** — `app/(site)/review/page.tsx` is a transactional post-payment page that should be excluded from Google's index.
- [ ] **Fix `/private-event` metadata** — Placeholder metadata on `app/(site)/private-event/page.tsx` needs proper title, description, OG tags, and canonical URL.
- [ ] **Remove `force-dynamic` from homepage** — `app/(site)/page.tsx` has `export const dynamic = 'force-dynamic'` which disables caching and hurts Core Web Vitals / TTFB. Use static generation or ISR instead.

---

## Important

- [ ] **Fix Event JSON-LD missing `startDate`** — `app/workshops/[slug]/page.tsx`: the `Event` structured data is missing `startDate`, which is required for Google rich event results.
- [ ] **Strip HTML from workshop meta description** — `app/workshops/[slug]/page.tsx`: the description pulled from rich-text may contain raw HTML tags (`<p>`, `<strong>`, etc.) that render poorly in Google snippets.
- [ ] **Add `/private-event` to sitemap** — `app/sitemap.ts` doesn't include the private event page. Google won't discover it automatically.
- [ ] **Fix `sitemap.ts` `lastModified`** — All entries currently report `new Date()` (today), which misleads Google's crawl scheduler. Use actual last-modified dates.
- [ ] **Fix `robots.ts` trailing slash mismatch** — Verify disallow rules in `app/robots.ts` match actual URL patterns (trailing slash inconsistencies).

---

## Minor

- [ ] **Remove broken `hreflang` from root layout** — `app/layout.tsx` lines 32–38: all three locales (`nl`, `en`, `tr`) map to the same URL. Google reads this as duplicate content. Remove the `alternates.languages` block entirely.
- [ ] **Fix Event JSON-LD stub schema** — Complete the structured data to qualify for rich results.
- [ ] **Add `width`/`height` to workshop OG images** — `app/workshops/[slug]/page.tsx` line 38: OG image object is missing `width` and `height`. Add `width: 1200, height: 630`.
- [ ] **Fix `prose-invert` on policy pages** — `app/(site)/contact/page.tsx`, `app/(site)/privacy-policy/page.tsx`, `app/(site)/refund/page.tsx`: `prose-invert` renders light text on a white background (likely invisible). Replace with `prose`.
- [ ] **Add `BreadcrumbList` JSON-LD** — Add breadcrumb structured data to `/workshops/[slug]`, `/faq`, and `/gift-voucher` pages for potential rich snippets in search results.

---

## Priority Order

| # | Fix | File |
|---|-----|------|
| 1 | Create `og-default.png` | `public/` |
| 2 | Add metadata to `/reserve` | `app/(site)/reserve/page.tsx` |
| 3 | Add `noindex` to `/review` | `app/(site)/review/page.tsx` |
| 4 | Fix `/private-event` metadata + add to sitemap | `app/(site)/private-event/page.tsx`, `app/sitemap.ts` |
| 5 | Remove `force-dynamic` from homepage | `app/(site)/page.tsx` |
| 6 | Remove broken `hreflang` from root layout | `app/layout.tsx` |
| 7 | Fix Event schema `startDate` | `app/workshops/[slug]/page.tsx` |
| 8 | Strip HTML from workshop meta description | `app/workshops/[slug]/page.tsx` |
| 9 | Fix `sitemap.ts` `lastModified` | `app/sitemap.ts` |
| 10 | Fix `robots.ts` trailing slashes | `app/robots.ts` |
| 11 | Fix `prose-invert` on policy pages | contact, privacy-policy, refund pages |
| 12 | Add OG image dimensions for workshop pages | `app/workshops/[slug]/page.tsx` |
| 13 | Add `BreadcrumbList` JSON-LD | workshop/FAQ/gift-voucher pages |
