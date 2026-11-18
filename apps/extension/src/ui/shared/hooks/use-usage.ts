import { useEffect, useState } from 'react';
import { browser } from '#imports';
import { refreshUsage } from '@/lib/billing/refresh-usage';
import { type StoredUsage, USAGE_KEY } from '@/lib/billing/stored-usage';

export function useUsage(): StoredUsage | null {
  const [usage, setUsage] = useState<StoredUsage | null>(null);

  useEffect(() => {
    const load = () =>
      browser.storage.local.get(USAGE_KEY).then((stored) => setUsage((stored[USAGE_KEY] as StoredUsage) ?? null));
    void load();
    void refreshUsage();
    const onChange = (changes: Record<string, unknown>) => {
      if (USAGE_KEY in changes) void load();
    };
    browser.storage.onChanged.addListener(onChange);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshUsage();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      browser.storage.onChanged.removeListener(onChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return usage;
}
