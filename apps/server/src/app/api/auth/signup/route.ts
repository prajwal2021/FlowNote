import { clientIp, signUp } from '@/lib/auth';
import { fail, json } from '@/lib/http';
import { sendWelcome } from '@/lib/mail';
import { API_SESSION_DAYS } from '@/lib/session-config';
import { setSessionCookie } from '@/lib/session-cookie';

export { OPTIONS } from '@/lib/cors';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown; client?: unknown } | null;
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') return fail(400, 'Email and password are required.');
  const kind = body.client === 'extension' || body.client === 'desktop' ? 'api' : 'web';
  const result = await signUp(body.email, body.password, kind, await clientIp());
  if (!result.ok) return fail(result.status, result.error);
  void sendWelcome(result.user.email).catch((error) => console.error('welcome mail failed', error));
  if (kind === 'web') {
    await setSessionCookie(result.token);
    return json({ user: result.user }, 201);
  }
  return json({ user: result.user, token: result.token, expiresInDays: API_SESSION_DAYS }, 201);
}
