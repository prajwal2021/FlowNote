import { syncGuides as runSync, type SyncState } from '@flownote/core/sync/sync-guides';
import { browser } from '#imports';
import { apiRequest } from './api-request';
import { readAuth } from './read-auth';

export async function syncGuides(): Promise<void> {
  const auth = await readAuth();
  if (!auth) return;
  const key = `flownoteSyncState:${auth.user.id}`;
  await runSync({
    request: apiRequest,
    loadState: async () => ((await browser.storage.local.get(key))[key] ?? {}) as SyncState,
    saveState: (state) => browser.storage.local.set({ [key]: state }),
  });
}
