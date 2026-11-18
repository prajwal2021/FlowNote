# Deploying the FlowNote server

The server is a Next.js app that owns sign-up, sign-in, shared links, the synced guide library and
the shared AI key. PostgreSQL holds accounts and metadata. A Railway storage bucket (S3-compatible)
holds every shared file and synced guide.

## Railway

`.railway/railway.ts` defines the service, which builds `apps/server/Dockerfile`. The container runs
`db/schema.sql` on every start (it is safe to re-run) and then serves on `$PORT`.

1. Create a project from the GitHub repository.
2. Add a PostgreSQL service and a bucket named `flownote-files`.
3. Set these variables on the app service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `PUBLIC_URL` | the public address, e.g. `https://app.example.com` |
| `COOKIE_SECURE` | `true` |
| `S3_ENDPOINT_URL` | `${{flownote-files.ENDPOINT}}` |
| `S3_REGION` | `${{flownote-files.REGION}}` |
| `S3_BUCKET` | `${{flownote-files.BUCKET}}` |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | `${{flownote-files.ACCESS_KEY_ID}}`, `${{flownote-files.SECRET_ACCESS_KEY}}` |
| `S3_FORCE_PATH_STYLE` | `false` (Railway buckets use virtual-hosted URLs) |
| `OPENAI_API_KEY` | the key every account uses for FlowNote AI |
| `AI_DAILY_LIMIT` | AI requests per account per day, default 100 |
| `SECRETS_KEY` | a random string of 32+ characters, e.g. `${{secret(44)}}`. Never change or lose it, or saved personal keys can't be read |
| `SUPPORT_EMAIL` | the contact address shown on `/privacy` and `/terms` |
| `RESEND_API_KEY`, `MAIL_FROM` | Resend API key and a sender on a verified domain, e.g. `FlowNote <no-reply@yourdomain.com>`. Required for password-reset email |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth client for "Continue with Google" (see below) |
| `EXTENSION_IDS` | comma-separated Chrome/Firefox extension IDs allowed to receive Google sign-in tokens. Required in production |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…`, or `sk_test_…` while testing) |
| `STRIPE_PRICE_ID` | the recurring price for FlowNote Pro (`price_…`) |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the webhook endpoint (`whsec_…`) |
| `FREE_RECORDING_LIMIT` | recordings a free account may make, default 5. Only enforced while Stripe is configured |

4. Generate a domain, or add a custom domain and point a CNAME at it from Cloudflare.

## Google sign-in

1. In Google Cloud Console create an OAuth client of type **Web application**.
2. Authorised redirect URI: `<PUBLIC_URL>/api/auth/google/callback`.
3. Configure the OAuth consent screen (app name, support email, the `/privacy` and `/terms` links, scopes
   `openid`, `email`, `profile`) and publish it to production.
4. Put the extension's ID (from the Chrome Web Store developer dashboard, or `chrome://extensions` for an
   unpacked build) in `EXTENSION_IDS`. The extension gets the token back on
   `https://<extension-id>.chromiumapp.org/`, which the server only redirects to for listed IDs.

## Payments

1. In Stripe create a product "FlowNote Pro" with a recurring price, and copy the price ID.
2. Add a webhook endpoint `<PUBLIC_URL>/api/billing/webhook` with the events `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`,
   `customer.subscription.paused` and `customer.subscription.resumed`.
3. Turn on the customer portal (Settings → Billing → Customer portal) so people can cancel and change cards.
4. Free accounts get `FREE_RECORDING_LIMIT` recordings; each new recording (not inserting steps into an
   existing guide) is counted on the server when it starts. Pro and admin accounts are unlimited.

## Storage

Create the bucket with `railway bucket create flownote-files`. It stays private; the server streams
files to signed-in users.

## First admin

Accounts are created by signing up. To make one an admin, run against the Railway database:

```
update users set role = 'admin' where email = 'you@example.com';
```

## Extension

Build with the server address baked in:

```
WXT_FLOWNOTE_SERVER=https://app.example.com pnpm zip
```

`pnpm zip` refuses to run without an `https://` server address. `pnpm build` and `pnpm dev` without the
variable talk to `http://localhost:3100`. See `CHROME_WEB_STORE.md` for the store submission.

## Backups

Railway's Postgres has its own backups. Back up the bucket alongside it.
