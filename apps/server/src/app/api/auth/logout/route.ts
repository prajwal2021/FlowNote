import { cookies } from 'next/headers';
import { currentToken, destroyToken } from '@/lib/auth';
import { json } from '@/lib/http';
import { SESSION_COOKIE } from '@/lib/session-config';

export { OPTIONS } from '@/lib/cors';

export async function POST() {
  const token = await currentToken();
  if (token) await destroyToken(token);
  (await cookies()).set(SESSION_COOKIE, '', { path: process.env.NEXT_PUBLIC_BASE_PATH || '/', maxAge: 0 });
  return json({ ok: true });
}
