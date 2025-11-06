# Workshop Reservation App

A simple workshop reservation app built with Next.js (App Router), Prisma (SQLite), Stripe Checkout, Tailwind CSS.

## Features
- Public reservation flow: choose category, pick date, see available timeslots, pay via Stripe Checkout (EUR).
- Admin: create categories, define available sessions (date/time, slots, price), view/cancel reservations with automatic Stripe refunds.
- Webhooks to sync payment status.

## Requirements
- Node.js 18+
- Stripe account + Stripe CLI for local webhooks

## Setup
1. Copy env
```fish
cp .env.example .env
```
2. Install deps
```fish
npm install
```
3. Init database
```fish
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
4. Dev
```fish
npm run dev
```
5. Stripe webhook (separate terminal)
```fish
# Replace with your webhook signing secret
set -x STRIPE_WEBHOOK_SECRET whsec_xxx
# Example (run stripe CLI yourself):
# stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

## Notes
- Admin auth is a simple password gate via cookie for now. Replace with a proper auth provider for production.
- SQLite is used locally. You can change `DATABASE_URL` to Postgres/MySQL if needed.

### Admin login
- URL: `http://localhost:3000/admin/login` (adjust port if your dev server runs on a different one, e.g. 3001/3002).
- Credentials are set via env:
	- `ADMIN_USERNAME`
	- `ADMIN_PASSWORD`
- After login, an `admin=1` cookie is set and the Admin menu will appear in the header.

## Production deployment

The app is production-ready with a few environment and platform considerations.

### 1) Environment variables (required)
Set these in your hosting provider (use live keys in production):

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
ADMIN_USERNAME=change-me
ADMIN_PASSWORD=change-me

# Database (recommend Postgres/MySQL for prod)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Stripe (LIVE mode keys in production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Dashboard > Developers > Webhooks

# Email (SMTP)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=apikey_or_username
SMTP_PASS=your_password
SMTP_FROM=Your Name <no-reply@yourdomain.com>

NODE_ENV=production
```

- `NEXT_PUBLIC_APP_URL` is used to build Stripe success/cancel URLs; make sure it matches your public domain.
- In production, do not use the Stripe CLI. Create a live webhook endpoint in the Stripe Dashboard and copy its signing secret to `STRIPE_WEBHOOK_SECRET`.

### 2) Stripe live webhooks
- Webhook endpoint URL: `https://your-domain.com/api/stripe/webhook`
- Events to enable at minimum:
	- `checkout.session.completed` (marks reservations as PAID)
	- `charge.refunded` (marks reservations as REFUNDED)
- The webhook handler runs on the Node.js runtime (already configured in `app/api/stripe/webhook/route.ts`).
- If you see `Webhook Error: No signatures found`, verify `STRIPE_WEBHOOK_SECRET` matches the endpoint’s secret in the Dashboard (Live vs Test).

### 3) Database & migrations
- Use a managed Postgres/MySQL in production; update `DATABASE_URL` accordingly.
- Run schema migrations on deploy:
	```bash
	npx prisma migrate deploy
	```
- Generate the client if your platform doesn’t run postinstall:
	```bash
	npx prisma generate
	```
- Seeding: `npm run prisma:seed` is meant for local dev; avoid running it automatically in production.

### 4) Build and run
```bash
npm install
npm run build
npm run start
```
- Requires Node.js 18+.
- Ensure your platform forwards the correct `PORT` and `HOST` (Next.js defaults are usually fine).

### 5) Middleware & admin
- Admin routes are protected by a simple cookie set at `/admin/login` via `middleware.ts`.
- For real-world usage, replace this with a proper identity provider (e.g., NextAuth/Auth.js, Clerk, etc.).
- Always use HTTPS in production so cookies are transmitted securely.

### 6) Operational tips
- Logging: Monitor your platform logs for webhook errors and reservation updates.
- Backups: Enable automatic database backups and set a retention policy.
- Monitoring: Track webhook delivery in Stripe Dashboard (replay failed events if needed).

### 7) Troubleshooting
- 400 on `/api/stripe/webhook`: Usually mismatched `STRIPE_WEBHOOK_SECRET` or an incorrect endpoint mode (Live vs Test).
- Redirect to `/admin/login` when accessing `/admin`: You’re not logged in—use the admin login with your configured credentials.
- Capacity errors during checkout: The API prevents overbooking; reduce `quantity` or increase session `capacity` in Admin.
- Emails not sending: Ensure SMTP variables are set and correct; some providers require application-specific passwords or ports (try 465 with `SMTP_PORT=465`).
	- For TLS hostname/cert issues, you can try:
		- `SMTP_SECURE=true` (implicit TLS on 465)
		- `SMTP_TLS_SERVERNAME=provider.hostname.example` (force SNI hostname)
		- `SMTP_TLS_REJECT_UNAUTHORIZED=false` (not recommended; last resort)
