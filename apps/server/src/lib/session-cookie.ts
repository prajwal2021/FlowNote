import { cookies } from 'next/headers';
import { SESSION_COOKIE, WEB_SESSION_DAYS } from './session-config';

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: process.env.NEXT_PUBLIC_BASE_PATH || '/',
    maxAge: WEB_SESSION_DAYS * 86_400,
  });
}
