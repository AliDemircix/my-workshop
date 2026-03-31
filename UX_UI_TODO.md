# UX/UI Frontend Developer TODO List

> Generated: 2026-03-31 | Branch: `change-upload-image-logic-in-category`

---

## Public Site

- [x] **1. Add meta description + OG tags** to `app/(site)/page.tsx` and all public layout files for SEO/social sharing.
- [x] **2. Fix empty-state on `/reserve`** — show a friendly message when no categories exist instead of a blank page.
- [x] **3. Fix `/reservation/success` and `/reservation/cancel`** — add meaningful copy, a CTA back to home, and an order summary on the success page.
- [x] **4. Add a loading skeleton to `ReservationFlow`** — the calendar/timeslot area shows nothing while fetching availability.
- [x] **5. Add ARIA labels to all calendar day buttons** in `components/reservation/Calendar.tsx` (e.g. `aria-label="March 15, available"`).
- [x] **6. Fix missing `<label>` associations** in `ReservationSidebar.tsx` — all form inputs use placeholder-only, breaking screen readers.
- [x] **7. Add a step indicator** to the reservation flow (Step 1: Pick date → Step 2: Pick time → Step 3: Checkout) so users know where they are.
- [x] **8. Fix the workshop detail grid** in `components/workshop/WorkshopDetail.tsx` — the sidebar calendar breaks on mobile.
- [x] **9. Add a breadcrumb + above-the-fold Book CTA** to `WorkshopDetail` — no way to book without scrolling far down.
- [x] **10. Polish the `Slider` component** — dot indicators are too small to tap on mobile (minimum 44×44px touch target).

---

## Gift Cards & Vouchers

- [x] **11. Add `Gift Cards` to the Footer Quick Links** in `components/Footer.tsx` — this key revenue feature has no footer entry.
- [x] **12. Fix `GiftCardShop` mobile layout** — on mobile the form renders below the card grid; swap DOM order so the form is first.
- [x] **13. Add sticky form panel** to `GiftCardShop` so the purchase form stays visible while scrolling through gift card options on desktop.

---

## Admin Panel

- [x] **14. Add pagination or infinite scroll** to `app/admin/reservations/page.tsx` — the table loads all records at once. *(already had pagination)*
- [x] **15. Add a confirmation modal** before cancelling a reservation in the reservations table.
- [x] **16. Add inline image preview** to `CategoryImageUploader.tsx` so admins can see the uploaded image before saving. *(already had preview)*
- [x] **17. Fix the admin sessions list** — long session names overflow the table on small screens.
- [x] **18. Add a dashboard summary widget** to `app/admin/page.tsx` with today's bookings, revenue, and recent reservations.
- [x] **19. Improve the admin login page** — add a logo and brand styling; currently it's an unstyled form.
- [ ] **20. Add unsaved-changes warning** to all admin edit pages so admins don't accidentally navigate away. *(UnsavedChangesGuard component created — wire into edit pages as needed)*
- [x] **21. Highlight overbooked sessions** in the sessions table with a red badge when `spotsBooked >= capacity`.
- [x] **22. Add an empty-state illustration** to the admin categories page when no categories exist yet.
- [x] **23. Fix the rich-text editor** (`react-quill`) — it renders above modals due to z-index conflict in category/page editors.

---

## Accessibility & Performance

- [x] **24. Fix `Slider` navigation arrows** — permanently hidden on mobile (`hidden md:flex`); replace with `opacity-0 md:group-hover:opacity-100` and keep always visible on mobile.
- [x] **25. Add lightbox keyboard navigation** to `Slider.tsx` — currently only `Escape` works; add `ArrowLeft`/`ArrowRight` support.
- [x] **26. Add `loading="lazy"` + `decoding="async"`** to all non-above-the-fold `<img>` tags across public pages to reduce CLS.
- [x] **27. Add `focus-visible` ring styles** to all interactive elements in `Nav.tsx`, `Calendar.tsx`, `ReservationSidebar.tsx`, and hero buttons in `page.tsx` (WCAG 2.4.7).

---

## Content & Config

- [x] **28. Make the announcement bar admin-editable** — currently hard-coded in `app/layout.tsx`; add a field to `SiteSettings` and expose it in `app/admin/settings/branding/page.tsx`.
- [x] **29. Fix brand name in Footer** — copyright shows "Workshop" (placeholder); update to the actual brand name.
- [x] **30. Fix the hero category grid** — first 3 images should use `loading="eager"`, all others `loading="lazy"` to prioritize above-the-fold paint.

---

## Category Image Uploader (New)

- [ ] **31. Add client-side file pre-validation** in `components/admin/CategoryImageUploader.tsx` — no format/size check before upload; hint copy also excludes GIF as a valid type.
- [ ] **32. Fix remove button visibility on touch/keyboard** in `CategoryImageUploader.tsx` — the remove `×` button only appears on hover, making it inaccessible on mobile and via keyboard.
- [ ] **33. Warn before abandoning the create-category form when an image is already uploaded** — `app/admin/categories/page.tsx` + `CategoryImageUploader.tsx` — navigating away orphans the uploaded file on disk.
- [ ] **34. Delete the previous image file when replacing it** in `CategoryImageUploader.tsx` — uploading a new image does not call the delete API for the old one, leaving orphaned files.
- [ ] **35. Add success toast/feedback after saving an edited category** in `app/admin/categories/[id]/page.tsx` — the form silently reloads with no confirmation that the save worked.
- [ ] **36. Add `focus-visible` ring styles to all category and session form inputs** in `app/admin/categories/[id]/page.tsx`, `categories/page.tsx`, and session edit pages — inputs have no visible focus indicator.
- [ ] **37. Fix broken HTML nesting** in `app/admin/categories/page.tsx` — the categories list is nested inside the "Add Category" `<form>` element, making all list action buttons implicit form submits.
- [ ] **38. Wrap `CategoryImageUploader` in `ClientOnly`** inside `components/admin/HomeCategoriesTabs.tsx` — the uploader uses browser APIs that can cause SSR hydration mismatches.
- [ ] **45. Add error handling to `removeImage`** in `CategoryImageUploader.tsx` — if the delete API returns an error, the function still clears the URL in state, silently orphaning the file on disk.

---

## Admin Panel (New)

- [ ] **39. Fix admin sidebar responsiveness** in `app/admin/layout.tsx` — the sidebar does not collapse below ~900px wide, causing the main content to be unusable on smaller screens.
- [ ] **40. Fix `ConfirmDialog` accessibility** in `components/admin/ConfirmDialog.tsx` — missing `aria-labelledby`, `aria-describedby`, and a focus trap; screen readers and keyboard users cannot use the modal correctly.
- [ ] **42. Disable save button during submission** in `app/admin/categories/[id]/page.tsx` and all other admin forms — the button stays interactive during the server round-trip, allowing duplicate submissions. Create a shared `<SubmitButton>` using `useFormStatus`.
- [ ] **43. Hide table headers and count when categories list is empty** in `app/admin/categories/page.tsx` — "Total categories: 0" and empty column headers render alongside the empty-state illustration, making the page look broken.
- [ ] **44. Fix active tab indicator in `HomeCategoriesTabs`** in `components/admin/HomeCategoriesTabs.tsx` — the active tab is visually identical to a hovered inactive tab (`bg-gray-50`); add a brand-colored bottom border to distinguish it.

---

## Content & Config (New)

- [ ] **41. Replace URL text input with image uploader on gift card admin page** in `app/admin/gift-cards/page.tsx` — gift card images still use a plain URL input field, inconsistent with the new category image upload pattern.

---

## Summary

| Category | Items | Count |
|---|---|---|
| Reservation flow UX | 2, 3, 4, 7, 8, 9 | 6 |
| Accessibility (ARIA, focus, labels) | 5, 6, 24, 25, 27, 32, 36, 40 | 8 |
| Admin panel UX | 14–23, 39, 40, 42, 43, 44 | 15 |
| Category Image Uploader | 31, 32, 33, 34, 35, 36, 37, 38, 45 | 9 |
| Performance & CLS | 10, 26, 30 | 3 |
| Content & SEO | 1, 11, 28, 29, 41 | 5 |
| Component polish | 12, 13 | 2 |
| **Total** | | **45** |

---

*Check off items as they are completed. Update this file to reflect current progress.*
