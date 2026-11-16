import { useEffect, useState } from 'react';
import type { CapturePermissions, PermissionKind } from '../../main/permissions';

const POLL_MS = 2000;

export function useCapturePermissions(open: boolean) {
  const [granted, setGranted] = useState<CapturePermissions | null>(null);
  const [screenAsked, setScreenAsked] = useState(false);
  const [restart, setRestart] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const read = () =>
      window.flownote.permissions.get().then((found) => {
        if (alive) setGranted(found);
      });
    void read();
    const timer = setInterval(read, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!screenAsked) return;
    const onFocus = () =>
      window.flownote.permissions.get().then((found) => {
        if (!found.screen) setRestart(true);
      });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [screenAsked]);

  const grant = (kind: PermissionKind) => {
    if (kind === 'screen') setScreenAsked(true);
    return window.flownote.permissions.request(kind);
  };

  return { granted, restart, grant };
}
