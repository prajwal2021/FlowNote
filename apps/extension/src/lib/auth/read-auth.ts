import { browser } from '#imports';
import { AUTH_KEY, type StoredAuth } from './stored-auth';

export async function readAuth(): Promise<StoredAuth | null> {
  const stored = await browser.storage.local.get(AUTH_KEY);
  const value = stored[AUTH_KEY] as StoredAuth | undefined;
  return value?.token && value.user ? value : null;
}
