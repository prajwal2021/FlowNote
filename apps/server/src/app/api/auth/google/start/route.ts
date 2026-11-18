import { NextResponse } from 'next/server';
import { allowedExtensionRedirect, googleAuthorizeUrl, googleConfigured } from '@/lib/google-oauth';
import { fail } from '@/lib/http';

export async function GET(request: Request) {
  if (!googleConfigured()) return fail(503, 'Google sign-in is not set up on this server.');
  const url = new URL(request.url);
  const client = url.searchParams.get('client') === 'extension' ? 'api' : 'web';
  const redirect = client === 'api' ? (url.searchParams.get('redirect_uri') ?? '') : (url.searchParams.get('next') ?? '/');
  if (client === 'api' && !allowedExtensionRedirect(redirect)) return fail(400, 'This app is not allowed to sign in with Google.');
  if (client === 'web' && !redirect.startsWith('/')) return fail(400, 'Invalid redirect.');
  return NextResponse.redirect(await googleAuthorizeUrl(client, redirect));
}
