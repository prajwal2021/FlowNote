import { useEffect, useState } from 'react';
import { browser } from '#imports';
import { readAuth } from '@/lib/auth/read-auth';
import { refreshAuth } from '@/lib/auth/refresh-auth';
import { AUTH_KEY, type StoredAuth } from '@/lib/auth/stored-auth';

export type AuthState = { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; auth: StoredAuth };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const load = () =>
      readAuth().then((auth) => setState(auth ? { status: 'signed-in', auth } : { status: 'signed-out' }));
    void load();
    void refreshAuth();
    const onChange = (changes: Record<string, unknown>) => {
      if (AUTH_KEY in changes) void load();
    };
    browser.storage.onChanged.addListener(onChange);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshAuth();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      browser.storage.onChanged.removeListener(onChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return state;
}
