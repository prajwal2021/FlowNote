import { localStorage } from '@flownote/core/env';
import { browser } from '#imports';
import { SERVER_URL } from './server-url';
import { AUTH_KEY, type StoredAuth } from './stored-auth';

export async function writeAuth(auth: StoredAuth | null): Promise<void> {
  if (auth) await browser.storage.local.set({ [AUTH_KEY]: auth });
  else await browser.storage.local.remove(AUTH_KEY);
  const org = auth?.user.canUseAi === true;
  await localStorage.set({
    orgAiBaseUrl: org ? `${SERVER_URL}/api/ai/v1` : '',
    orgAiToken: org && auth ? auth.token : '',
  });
}
