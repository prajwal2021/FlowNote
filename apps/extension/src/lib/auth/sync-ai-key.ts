import { type AiKeyMark, syncAiKey as runSync } from '@flownote/core/sync/sync-ai-key';
import { browser } from '#imports';
import { apiRequest } from './api-request';
import { readAuth } from './read-auth';

export async function syncAiKey(): Promise<void> {
  const auth = await readAuth();
  if (!auth) return;
  const key = `flownoteAiKeyMark:${auth.user.id}`;
  await runSync({
    request: apiRequest,
    loadMark: async () => ((await browser.storage.local.get(key))[key] ?? null) as AiKeyMark | null,
    saveMark: (mark) => browser.storage.local.set({ [key]: mark }),
  });
}
