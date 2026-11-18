import { NextResponse } from 'next/server';
import { clientIp, signInWithGoogle } from '@/lib/auth';
import { consumeState, exchangeCode } from '@/lib/google-oauth';
import { setSessionCookie } from '@/lib/session-cookie';
import { publicUrl } from '@/lib/storage';

const MESSAGES = {
  failed: 'Google sign-in failed. Try again.',
  frozen: 'This account has been suspended. Contact support.',
} as const;

function webError(message: string): NextResponse {
  return NextResponse.redirect(`${publicUrl()}/login?error=${encodeURIComponent(message)}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = await consumeState(url.searchParams.get('state') ?? '');
  if (!state) return webError(MESSAGES.failed);
  const fragmentError = (message: string) =>
    NextResponse.redirect(`${state.redirect}#${new URLSearchParams({ error: message })}`);
  const fail = (message: string) => (state.client === 'api' ? fragmentError(message) : webError(message));

  const code = url.searchParams.get('code');
  const profile = code ? await exchangeCode(code) : null;
  if (!profile) return fail(MESSAGES.failed);
  const result = await signInWithGoogle(profile, state.client, await clientIp());
  if (!result.ok) return fail(result.reason === 'frozen' ? MESSAGES.frozen : MESSAGES.failed);

  if (state.client === 'api') return NextResponse.redirect(`${state.redirect}#${new URLSearchParams({ token: result.token })}`);
  await setSessionCookie(result.token);
  return NextResponse.redirect(`${publicUrl()}${state.redirect}`);
}
