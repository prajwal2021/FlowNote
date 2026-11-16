import { getGuide } from '@flownote/core/guides/service';
import { applySnapshot } from '@flownote/core/sync/snapshot';
import { browser } from '#imports';
import { getExtensionURL } from '@/lib/browser-api/get-extension-url';

const SAMPLES = ['basic', 'ai', 'voice'] as const;
const VERSION = 1;
const MARKER = 'flownoteSamplesInstalled';

export async function installSampleGuides(): Promise<void> {
  const stored = (await browser.storage.local.get(MARKER))[MARKER] as number | undefined;
  if (stored !== undefined && stored >= VERSION) return;
  for (const variant of SAMPLES) {
    if (await getGuide(`sample-getting-started-${variant}`)) continue;
    const response = await fetch(getExtensionURL(`/samples/getting-started-${variant}.snap` as never));
    if (response.ok) await applySnapshot(await response.blob());
  }
  await browser.storage.local.set({ [MARKER]: VERSION });
}
