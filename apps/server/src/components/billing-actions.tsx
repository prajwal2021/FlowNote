'use client';

import { useState } from 'react';
import { Button } from './ui';
import { withBase } from '@/lib/base-path';

export function BillingActions({ pro }: { pro: boolean }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    setError('');
    const response = await fetch(withBase(pro ? '/api/billing/portal' : '/api/billing/checkout'), { method: 'POST' }).catch(() => null);
    const body = await response?.json().catch(() => ({}));
    if (!response?.ok || !body?.url) {
      setError(body?.error ?? 'Something went wrong. Try again.');
      setBusy(false);
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div className="space-y-2">
      <Button onClick={open} disabled={busy} variant={pro ? 'outline' : 'primary'}>
        {busy ? 'Opening…' : pro ? 'Manage billing' : 'Upgrade to Pro'}
      </Button>
      {error && <p role="alert" className="text-xs font-medium text-status-bad-foreground">{error}</p>}
    </div>
  );
}
