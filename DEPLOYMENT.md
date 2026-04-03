# Production Deployment Checklist

A step-by-step guide to deploy this Next.js app on a Hostinger VPS with CyberPanel + OpenLiteSpeed.

---

## 1. Local Preparation

- [ ] Fix any TypeScript errors before deploying (`npm run build` locally must pass)
- [ ] Ensure `.github/workflows/deploy.yml` exists and is **not** in `.gitignore`
- [ ] `next.config.mjs` must NOT have `output: 'standalone'` — use default server mode
- [ ] Root layout (`app/layout.tsx`) must have `export const dynamic = 'force-dynamic'`
- [ ] Remove any duplicate page re-exports (e.g. `app/page.tsx` re-exporting `app/(site)/page.tsx`)
- [ ] Commit and push all changes to `main` branch

---

## 2. GitHub Repository Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret Name | Value |
|---|---|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Private SSH key (generated on VPS) |

### Generate SSH Key on VPS
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy  # Copy this as VPS_SSH_KEY secret
```

---

## 3. VPS Initial Setup (AlmaLinux 9)

### Install Node.js & PM2
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git
npm install -g pm2
```

### Firewall
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 4. CyberPanel — Find Correct Document Root

```bash
ls /home/giftoria.nl/   # Find your subdomain folder
# e.g. /home/giftoria.nl/workshop.giftoria.nl/public_html
```

---

## 5. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git /home/DOMAIN/SUBDOMAIN/public_html
cd /home/DOMAIN/SUBDOMAIN/public_html
```

---

## 6. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Required values:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong_password_here
DATABASE_URL="file:./prod.db"
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=your_smtp_password
SMTP_FROM=Your Name <your@email.com>
```

---

## 7. Database Setup

```bash
# Run all migrations
npx prisma migrate deploy

# If columns are missing (schema drift), push schema directly
npx prisma db push
```

---

## 8. Build & Start

```bash
npm install
npm run build
pm2 start npm --name "my-workshop" -- start
pm2 save
pm2 startup  # Run the output command to enable auto-start on reboot
```

---

## 9. CyberPanel — Configure OpenLiteSpeed Proxy

Go to: **CyberPanel → Websites → your subdomain → Manage → vHost Conf**

Replace the entire content with:

```nginx
docRoot                   /home/DOMAIN/SUBDOMAIN
vhDomain                  $VH_NAME
vhAliases                 www.$VH_NAME
adminEmails               your@email.com
enableGzip                1
enableIpGeo               1

index  {
  useServer               0
  indexFiles              index.php, index.html
}

errorlog $VH_ROOT/logs/error_log {
  useServer               0
  logLevel                WARN
  rollingSize             10M
}

accesslog $VH_ROOT/logs/access_log {
  useServer               0
  logFormat               "%h %l %u %t \"%r\" %>s %b"
  rollingSize             10M
  keepDays                10
  compressArchive         1
}

phpIniOverride  {
}

module cache {
  storagePath /usr/local/lsws/cachedata/$VH_NAME
}

extprocessor node3000 {
  type                    proxy
  address                 127.0.0.1:3000
  maxConns                100
  initTimeout             60
  retryTimeout            0
  respBuffer              0
}

context / {
  type                    proxy
  handler                 node3000
  addDefaultCharset       off
}

context /.well-known/acme-challenge {
  location                /usr/local/lsws/Example/html/.well-known/acme-challenge
  allowBrowse             1
  rewrite  {
    enable                  0
  }
  addDefaultCharset       off
  phpIniOverride  {
  }
}

vhssl  {
  keyFile                 /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem
  certFile                /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem
  certChain               1
  sslProtocol             24
  enableECDHE             1
  renegProtection         1
  sslSessionCache         1
  enableSpdy              15
  enableStapling           1
  ocspRespMaxAge           86400
}
```

> **Important:** `extprocessor node3000` must come **before** `context /`

---

## 10. SSL Certificate (Let's Encrypt)

```bash
certbot certonly --webroot -w /usr/local/lsws/Example/html \
  -d your-subdomain.com \
  --non-interactive --agree-tos -m your@email.com
```

Update `vhssl` paths in vHost Conf if certbot creates a `-0001` directory:
```
keyFile   /etc/letsencrypt/live/your-domain-0001/privkey.pem
certFile  /etc/letsencrypt/live/your-domain-0001/fullchain.pem
```

Restart OpenLiteSpeed:
```bash
systemctl restart lsws
```

---

## 11. Stripe Webhook

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `charge.refunded`
4. Copy the **Signing secret** (`whsec_...`) and update `.env`

---

## 12. Update GitHub Actions Deploy Path

Edit `.github/workflows/deploy.yml` — ensure the path matches your actual document root:

```yaml
script: |
  cd /home/DOMAIN/SUBDOMAIN/public_html
  git pull origin main
  npm install --production=false
  npm run build
  pm2 restart my-workshop || pm2 start npm --name "my-workshop" -- start
  pm2 save
```

---

## 13. Verify Everything

```bash
# App is running
pm2 status

# App responds locally
curl -s http://127.0.0.1:3000 | grep "<title>"

# Domain responds (ignore SSL warning with -k if needed)
curl -sk https://your-domain.com | grep "<title>"

# Database is accessible
node -e "const {PrismaClient} = require('./node_modules/@prisma/client'); const p = new PrismaClient(); p.siteSettings.findMany().then(r => console.log('DB OK:', r.length)).catch(e => console.log('ERR:', e.message))"
```

---

## Common Issues & Fixes

| Error | Fix |
|---|---|
| `prerender-manifest.json not found` | Build failed — check `npm run build` output |
| `table does not exist` | Run `npx prisma migrate deploy` then `npx prisma db push` |
| `column does not exist` | Run `npx prisma db push` to sync schema |
| `clientModules undefined` | Remove duplicate `app/page.tsx` re-export wrapper |
| `Proxy target is not defined` | `extprocessor` block must be defined BEFORE `context /` in vHost Conf |
| SSL self-signed warning | Run certbot and update `vhssl` paths in vHost Conf |
| `next start` with standalone warning | Remove `output: 'standalone'` from `next.config.mjs` |
