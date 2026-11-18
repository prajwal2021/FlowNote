import { login } from '@/lib/auth';
import { fail, json } from '@/lib/http';
import { API_SESSION_DAYS } from '@/lib/session-config';
import { setSessionCookie } from '@/lib/session-cookie';

export { OPTIONS } from '@/lib/cors';

const MESSAGES = {
  invalid: 'Incorrect email or password.',
  frozen: 'This account has been suspended. Contact support.',
  locked: 'Too many failed attempts. Wait 15 minutes or reset your password.',
} as const;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown; client?: unknown } | null;
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') return fail(400, 'Email and password are required.');
  const kind = body.client === 'extension' || body.client === 'desktop' ? 'api' : 'web';
  const result = await login(body.email, body.password, kind);
  if (!result.ok) return fail(result.reason === 'invalid' ? 401 : result.reason === 'locked' ? 429 : 403, MESSAGES[result.reason]);
  if (kind === 'web') {
    await setSessionCookie(result.token);
    return json({ user: result.user });
  }
  return json({ user: result.user, token: result.token, expiresInDays: API_SESSION_DAYS });
}
