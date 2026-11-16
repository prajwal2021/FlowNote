# Deploying the FlowNote server

The server is a Next.js app that owns sign-up, sign-in, shared links, the synced guide library and
the shared AI key. PostgreSQL holds accounts and metadata. An S3-compatible bucket (Cloudflare R2)
holds every shared file and synced guide.

## Railway

`.railway/railway.ts` defines the service, which builds `apps/server/Dockerfile`. The container runs
`db/schema.sql` on every start (it is safe to re-run) and then serves on `$PORT`.

1. Create a project from the GitHub repository.
2. Add a PostgreSQL service.
3. Set these variables on the app service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `PUBLIC_URL` | the public address, e.g. `https://app.example.com` |
| `COOKIE_SECURE` | `true` |
| `S3_ENDPOINT_URL` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | the R2 bucket name |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | an R2 API token with read and write on that bucket |
| `OPENAI_API_KEY` | the key every account uses for FlowNote AI |
| `AI_DAILY_LIMIT` | AI requests per account per day, default 100 |
| `SECRETS_KEY` | `openssl rand -base64 32`. Never change or lose it, or saved personal keys can't be read |

4. Generate a domain, or add a custom domain and point a CNAME at it from Cloudflare.

## Cloudflare R2

Create a bucket, then an R2 API token scoped to it with Object Read & Write. The bucket stays
private; the server streams files to signed-in users.

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

Railway's Postgres has its own backups. Back up the R2 bucket alongside it.
