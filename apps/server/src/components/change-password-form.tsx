'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, Field } from './ui';
import { withBase } from '@/lib/base-path';

export function ChangePasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (next !== confirm) return setError('The new passwords do not match.');
    setBusy(true);
    setError('');
    const response = await fetch(withBase('/api/auth/change-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error ?? 'Could not change the password.');
      setBusy(false);
      return;
    }
    const target = params.get('next');
    router.replace(target?.startsWith('/') ? target : '/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Current password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      <Field label="New password" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-xs font-medium text-status-bad-foreground">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
        {busy ? 'Saving…' : 'Update password'}
      </Button>
    </form>
  );
}
