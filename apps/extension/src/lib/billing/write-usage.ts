import { browser } from '#imports';
import { USAGE_KEY, type Usage } from './stored-usage';

export async function writeUsage(usage: Usage | null, blocked = false): Promise<void> {
  if (usage) await browser.storage.local.set({ [USAGE_KEY]: { ...usage, blocked } });
  else await browser.storage.local.remove(USAGE_KEY);
}
