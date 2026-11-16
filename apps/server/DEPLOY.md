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

4. Generate a domain, or add a custom domain and point a CNAME at it from Cloudflare.

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

Without the variable the extension talks to `http://localhost:3100`.

## Backups

Railway's Postgres has its own backups. Back up the bucket alongside it.
