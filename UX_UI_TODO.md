# UX/UI Frontend Developer TODO List

> Generated: 2026-03-31 | Branch: `change-upload-image-logic-in-category`

---

## Public Site

- [ ] **1. Add meta description + OG tags** to `app/(site)/page.tsx` and all public layout files for SEO/social sharing.
- [ ] **2. Fix empty-state on `/reserve`** — show a friendly message when no categories exist instead of a blank page.
- [ ] **3. Fix `/reservation/success` and `/reservation/cancel`** — add meaningful copy, a CTA back to home, and an order summary on the success page.
- [ ] **4. Add a loading skeleton to `ReservationFlow`** — the calendar/timeslot area shows nothing while fetching availability.
- [ ] **5. Add ARIA labels to all calendar day buttons** in `components/reservation/Calendar.tsx` (e.g. `aria-label="March 15, available"`).
- [ ] **6. Fix missing `<label>` associations** in `ReservationSidebar.tsx` — all form inputs use placeholder-only, breaking screen readers.
- [ ] **7. Add a step indicator** to the reservation flow (Step 1: Pick date → Step 2: Pick time → Step 3: Checkout) so users know where they are.
- [ ] **8. Fix the workshop detail grid** in `components/workshop/WorkshopDetail.tsx` — the sidebar calendar breaks on mobile.
- [ ] **9. Add a breadcrumb + above-the-fold Book CTA** to `WorkshopDetail` — no way to book without scrolling far down.
- [ ] **10. Polish the `Slider` component** — dot indicators are too small to tap on mobile (minimum 44×44px touch target).

---

## Gift Cards & Vouchers

- [ ] **11. Add `Gift Cards` to the Footer Quick Links** in `components/Footer.tsx` — this key revenue feature has no footer entry.
- [ ] **12. Fix `GiftCardShop` mobile layout** — on mobile the form renders below the card grid; swap DOM order so the form is first.
- [ ] **13. Add sticky form panel** to `GiftCardShop` so the purchase form stays visible while scrolling through gift card options on desktop.

---

## Admin Panel

- [ ] **14. Add pagination or infinite scroll** to `app/admin/reservations/page.tsx` — the table loads all records at once.
- [ ] **15. Add a confirmation modal** before cancelling a reservation in the reservations table.
- [ ] **16. Add inline image preview** to `CategoryImageUploader.tsx` so admins can see the uploaded image before saving.
- [ ] **17. Fix the admin sessions list** — long session names overflow the table on small screens.
- [ ] **18. Add a dashboard summary widget** to `app/admin/page.tsx` with today's bookings, revenue, and recent reservations.
- [ ] **19. Improve the admin login page** — add a logo and brand styling; currently it's an unstyled form.
- [ ] **20. Add unsaved-changes warning** to all admin edit pages so admins don't accidentally navigate away.
- [ ] **21. Highlight overbooked sessions** in the sessions table with a red badge when `spotsBooked >= capacity`.
- [ ] **22. Add an empty-state illustration** to the admin categories page when no categories exist yet.
- [ ] **23. Fix the rich-text editor** (`react-quill`) — it renders above modals due to z-index conflict in category/page editors.

---

## Accessibility & Performance

- [ ] **24. Fix `Slider` navigation arrows** — permanently hidden on mobile (`hidden md:flex`); replace with `opacity-0 md:group-hover:opacity-100` and keep always visible on mobile.
- [ ] **25. Add lightbox keyboard navigation** to `Slider.tsx` — currently only `Escape` works; add `ArrowLeft`/`ArrowRight` support.
- [ ] **26. Add `loading="lazy"` + `decoding="async"`** to all non-above-the-fold `<img>` tags across public pages to reduce CLS.
- [ ] **27. Add `focus-visible` ring styles** to all interactive elements in `Nav.tsx`, `Calendar.tsx`, `ReservationSidebar.tsx`, and hero buttons in `page.tsx` (WCAG 2.4.7).

---

## Content & Config

- [ ] **28. Make the announcement bar admin-editable** — currently hard-coded in `app/layout.tsx`; add a field to `SiteSettings` and expose it in `app/admin/settings/page.tsx`.
- [ ] **29. Fix brand name in Footer** — copyright shows "Workshop" (placeholder); update to the actual brand name.
- [ ] **30. Fix the hero category grid** — first 3 images should use `loading="eager"`, all others `loading="lazy"` to prioritize above-the-fold paint.

---

## Summary

| Category | Items | Count |
|---|---|---|
| Reservation flow UX | 2, 3, 4, 7, 8, 9 | 6 |
| Accessibility (ARIA, focus, labels) | 5, 6, 24, 25, 27 | 5 |
| Admin panel UX | 14–23 | 10 |
| Performance & CLS | 10, 26, 30 | 3 |
| Content & SEO | 1, 11, 28, 29 | 4 |
| Component polish | 12, 13 | 2 |
| **Total** | | **30** |

---

*Check off items as they are completed. Update this file to reflect current progress.*
