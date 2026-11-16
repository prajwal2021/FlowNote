import { shortcutLabel } from '@flownote/core/capture/shortcut-label';
import { useEffect, useState } from 'react';

const DEFAULT_RECORD = 'Alt+Shift+1';

export function useRecordShortcut(mac: boolean): string {
  const [accelerator, setAccelerator] = useState(DEFAULT_RECORD);

  useEffect(() => {
    void window.flownote.capture.settings
      .get()
      .then((settings) => setAccelerator(settings.shortcuts.record || DEFAULT_RECORD));
  }, []);

  return shortcutLabel(accelerator, mac);
}
