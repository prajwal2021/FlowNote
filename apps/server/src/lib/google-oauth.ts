import { randomBytes } from 'node:crypto';
import { query, queryOne } from './db';
import { publicUrl } from './storage';

const STATE_MINUTES = 10;
const EXTENSION_REDIRECT = /^https:\/\/([a-z0-9-]+)\.(chromiumapp\.org|extensions\.allizom\.org)\/[^#]*$/;

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function callbackUrl(): string {
  return `${publicUrl()}/api/auth/google/callback`;
}

export function allowedExtensionRedirect(redirect: string): boolean {
  const match = EXTENSION_REDIRECT.exec(redirect);
  if (!match) return false;
  const allowed = (process.env.EXTENSION_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (allowed.length === 0) return process.env.NODE_ENV !== 'production';
  return allowed.includes(match[1]);
}

export async function googleAuthorizeUrl(client: 'web' | 'api', redirect: string): Promise<string> {
  const state = randomBytes(24).toString('base64url');
  await query(`delete from oauth_states where created_at < now() - make_interval(mins => $1)`, [STATE_MINUTES]);
  await query('insert into oauth_states (state, client, redirect) values ($1, $2, $3)', [state, client, redirect]);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function consumeState(state: string): Promise<{ client: 'web' | 'api'; redirect: string } | null> {
  return queryOne<{ client: 'web' | 'api'; redirect: string }>(
    `delete from oauth_states where state = $1 and created_at > now() - make_interval(mins => $2) returning client, redirect`,
    [state, STATE_MINUTES],
  );
}

interface IdTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  exp: number;
}

export async function exchangeCode(code: string): Promise<{ sub: string; email: string; name: string } | null> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: callbackUrl(),
      grant_type: 'authorization_code',
    }),
  });
  if (!response.ok) return null;
  const { id_token: idToken } = (await response.json()) as { id_token?: string };
  const payload = idToken?.split('.')[1];
  if (!payload) return null;
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as IdTokenClaims;
  const issuerOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
  if (!issuerOk || claims.aud !== process.env.GOOGLE_CLIENT_ID || claims.exp * 1000 < Date.now()) return null;
  if (!claims.email || claims.email_verified !== true) return null;
  return { sub: claims.sub, email: claims.email, name: claims.name ?? '' };
}
