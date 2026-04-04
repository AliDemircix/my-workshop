# TODO

## Google Comments Integration

**Status:** Pending  
**Priority:** Medium

Replace the placeholder "What Our Students Say" testimonials section on the homepage with real Google Reviews/Comments.

### Plan
- Integrate Google Places API or a third-party widget (e.g., Elfsight, EmbedSocial) to fetch and display real Google reviews
- The admin toggle `showTestimonials` (in Settings) already controls visibility of this section — reuse it
- Once real reviews are integrated, enable the toggle from the admin panel

### Notes
- Current placeholder testimonials are disabled by default via the admin settings toggle
- Admin path: `/admin/settings` → toggle "Testimonials"
