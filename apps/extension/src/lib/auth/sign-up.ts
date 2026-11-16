import { i18n } from '@flownote/core/env';
import { SERVER_URL } from './server-url';
import type { AuthUser } from './stored-auth';
import { writeAuth } from './write-auth';

export async function signUp(email: string, password: string): Promise<{ error?: string; user?: AuthUser }> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, client: 'extension' }),
    });
  } catch {
    return { error: i18n.t('account.serverUnreachable') };
  }
  const body = (await response.json().catch(() => ({}))) as { error?: string; token?: string; user?: AuthUser };
  if (!response.ok || !body.token || !body.user) return { error: body.error ?? i18n.t('account.serverUnreachable') };
  await writeAuth({ token: body.token, user: body.user });
  return { user: body.user };
}
