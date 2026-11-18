import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { query, queryOne } from './db';
import { API_SESSION_DAYS, SESSION_COOKIE, WEB_SESSION_DAYS } from './session-config';

type Role = 'admin' | 'user';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  canUseAi: boolean;
  mustChangePassword: boolean;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'active' | 'frozen';
  can_use_ai: boolean;
  password_hash: string | null;
  must_change_password: boolean;
  failed_attempts: number;
  locked_until: Date | null;
}

const DUMMY_HASH = bcrypt.hashSync('flownote-timing-pad', 12);

function toSessionUser(row: Pick<UserRow, 'id' | 'email' | 'name' | 'role' | 'can_use_ai' | 'must_change_password'>): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    canUseAi: row.can_use_ai,
    mustChangePassword: row.must_change_password,
  };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 200) return 'Password is too long.';
  return null;
}

export function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export type LoginResult =
  | { ok: true; user: SessionUser; token: string; kind: 'web' | 'api' }
  | { ok: false; reason: 'invalid' | 'frozen' | 'locked' };

const MAX_FAILED_ATTEMPTS = 10;
const LOCK_MINUTES = 15;

export async function login(emailInput: string, password: string, kind: 'web' | 'api'): Promise<LoginResult> {
  const email = emailInput.trim().toLowerCase();
  const user = await queryOne<UserRow>('select * from users where email = $1', [email]);
  if (!user) {
    await audit(null, 'auth.login-failed', email);
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: 'invalid' };
  }
  if (user.locked_until && user.locked_until.getTime() > Date.now()) {
    await bcrypt.compare(password, DUMMY_HASH);
    await audit(user.id, 'auth.login-blocked-locked', user.email);
    return { ok: false, reason: 'locked' };
  }
  const match = await bcrypt.compare(password, user.password_hash ?? DUMMY_HASH);
  if (!match || !user.password_hash) {
    await query(
      `update users set failed_attempts = failed_attempts + 1,
         locked_until = case when failed_attempts + 1 >= $2 then now() + make_interval(mins => $3) else locked_until end
       where id = $1`,
      [user.id, MAX_FAILED_ATTEMPTS, LOCK_MINUTES],
    );
    await audit(user.id, 'auth.login-failed', user.email);
    return { ok: false, reason: 'invalid' };
  }
  if (user.status === 'frozen') {
    await audit(user.id, 'auth.login-blocked-frozen', user.email);
    return { ok: false, reason: 'frozen' };
  }
  await query('update users set last_login_at = now(), failed_attempts = 0, locked_until = null where id = $1', [user.id]);
  await audit(user.id, 'auth.login', user.email, { client: kind });
  return { ok: true, user: toSessionUser(user), token: await createSession(user.id, kind), kind };
}

async function createSession(userId: string, kind: 'web' | 'api'): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const days = kind === 'web' ? WEB_SESSION_DAYS : API_SESSION_DAYS;
  await query('insert into sessions (token_hash, user_id, kind, expires_at) values ($1, $2, $3, $4)', [
    hashToken(token),
    userId,
    kind,
    new Date(Date.now() + days * 86_400_000),
  ]);
  return token;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNUPS_PER_HOUR = 5;

export type SignUpResult =
  | { ok: true; user: SessionUser; token: string; kind: 'web' | 'api' }
  | { ok: false; status: number; error: string };

export async function signUp(emailInput: string, password: string, kind: 'web' | 'api', ip: string): Promise<SignUpResult> {
  const email = emailInput.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, status: 400, error: 'Enter a valid email address.' };
  const weak = validatePassword(password);
  if (weak) return { ok: false, status: 400, error: weak };
  const recent = await queryOne<{ n: number }>(
    `select count(*)::int as n from audit_log where action = 'auth.signup' and detail->>'ip' = $1 and at > now() - interval '1 hour'`,
    [ip],
  );
  if ((recent?.n ?? 0) >= SIGNUPS_PER_HOUR) return { ok: false, status: 429, error: 'Too many new accounts from this network. Try again later.' };
  const row = await queryOne<UserRow>(
    `insert into users (email, password_hash, can_use_ai) values ($1, $2, true)
     on conflict (email) do nothing returning *`,
    [email, await hashPassword(password)],
  );
  if (!row) return { ok: false, status: 409, error: 'An account with this email already exists. Sign in instead.' };
  await audit(row.id, 'auth.signup', row.email, { client: kind, ip });
  await query('update users set last_login_at = now() where id = $1', [row.id]);
  return { ok: true, user: toSessionUser(row), token: await createSession(row.id, kind), kind };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

async function userForToken(token: string): Promise<SessionUser | null> {
  const row = await queryOne<UserRow>(
    `select u.* from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now() and u.status = 'active'`,
    [hashToken(token)],
  );
  return row ? toSessionUser(row) : null;
}

export async function destroyToken(token: string): Promise<void> {
  await query('delete from sessions where token_hash = $1', [hashToken(token)]);
}

export async function destroyUserSessions(userId: string): Promise<void> {
  await query('delete from sessions where user_id = $1', [userId]);
}

export async function currentToken(): Promise<string | null> {
  const auth = (await headers()).get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = await currentToken();
  return token ? userForToken(token) : null;
}

export async function audit(actorId: string | null, action: string, target: string | null, detail?: unknown): Promise<void> {
  await query('insert into audit_log (actor_id, action, target, detail) values ($1, $2, $3, $4)', [
    actorId,
    action,
    target,
    detail ? JSON.stringify(detail) : null,
  ]);
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
}

export async function signInWithGoogle(profile: GoogleProfile, kind: 'web' | 'api', ip: string): Promise<LoginResult> {
  const email = profile.email.trim().toLowerCase();
  let user = await queryOne<UserRow>('select * from users where google_sub = $1', [profile.sub]);
  if (!user) {
    const existing = await queryOne<{ id: string; email_verified: boolean }>(
      'select id, email_verified from users where email = $1 and google_sub is null',
      [email],
    );
    if (existing && !existing.email_verified) await destroyUserSessions(existing.id);
    user = await queryOne<UserRow>(
      `update users set google_sub = $2, email_verified = true,
         password_hash = case when email_verified then password_hash else null end,
         name = case when name = '' then $3 else name end
       where email = $1 and google_sub is null returning *`,
      [email, profile.sub, profile.name.slice(0, 120)],
    );
    if (user) await audit(user.id, 'auth.google-linked', user.email);
  }
  if (!user) {
    user = await queryOne<UserRow>(
      `insert into users (email, name, google_sub, email_verified, can_use_ai) values ($1, $2, $3, true, true)
       on conflict (email) do nothing returning *`,
      [email, profile.name.slice(0, 120), profile.sub],
    );
    if (!user) return { ok: false, reason: 'invalid' };
    await audit(user.id, 'auth.signup', user.email, { client: kind, ip, provider: 'google' });
  }
  if (user.status === 'frozen') {
    await audit(user.id, 'auth.login-blocked-frozen', user.email);
    return { ok: false, reason: 'frozen' };
  }
  await query('update users set last_login_at = now(), failed_attempts = 0, locked_until = null where id = $1', [user.id]);
  await audit(user.id, 'auth.login', user.email, { client: kind, provider: 'google' });
  return { ok: true, user: toSessionUser(user), token: await createSession(user.id, kind), kind };
}
