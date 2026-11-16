import { onGuidesChanged } from '@flownote/core/guides/service';
import { useEffect } from 'react';
import { browser } from '#imports';
import { syncAiKey } from '@/lib/auth/sync-ai-key';
import { syncGuides } from '@/lib/auth/sync-guides';
import { installSampleGuides } from '@/lib/samples/install-sample-guides';

const DEBOUNCE_MS = 4_000;
const KEY_DEBOUNCE_MS = 1_500;
const INTERVAL_MS = 120_000;

export function useGuideSync(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let keyTimer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void syncGuides(), DEBOUNCE_MS);
    };
    const onStorage = (changes: Record<string, unknown>) => {
      if (!('apiKeys' in changes)) return;
      clearTimeout(keyTimer);
      keyTimer = setTimeout(() => void syncAiKey(), KEY_DEBOUNCE_MS);
    };
    void installSampleGuides().catch(() => undefined);
    void syncAiKey().then(() => syncGuides());
    const stop = onGuidesChanged(schedule);
    browser.storage.onChanged.addListener(onStorage);
    const interval = setInterval(() => {
      void syncAiKey();
      void syncGuides();
    }, INTERVAL_MS);
    return () => {
      stop();
      browser.storage.onChanged.removeListener(onStorage);
      clearTimeout(timer);
      clearTimeout(keyTimer);
      clearInterval(interval);
    };
  }, []);
}
