import { i18n } from '@flownote/core/env';
import { browser } from '#imports';
import { SERVER_URL } from './server-url';
import type { AuthUser } from './stored-auth';
import { writeAuth } from './write-auth';

export async function signInWithGoogle(): Promise<{ error?: string; user?: AuthUser }> {
  const redirect = browser.identity.getRedirectURL();
  const start = `${SERVER_URL}/api/auth/google/start?client=extension&redirect_uri=${encodeURIComponent(redirect)}`;
  let finalUrl: string | undefined;
  try {
    finalUrl = await browser.identity.launchWebAuthFlow({ url: start, interactive: true });
  } catch {
    return {};
  }
  const params = new URLSearchParams(new URL(finalUrl ?? redirect).hash.slice(1));
  const token = params.get('token');
  if (!token) return { error: params.get('error') ?? i18n.t('account.googleFailed') };
  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    return { error: i18n.t('account.serverUnreachable') };
  }
  if (!response.ok) return { error: i18n.t('account.googleFailed') };
  const { user } = (await response.json()) as { user: AuthUser };
  await writeAuth({ token, user });
  return { user };
}
