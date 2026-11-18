'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, Field } from './ui';
import { withBase } from '@/lib/base-path';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setError('The passwords do not match.');
    setBusy(true);
    setError('');
    const response = await fetch(withBase('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);
    const body = await response?.json().catch(() => ({}));
    setBusy(false);
    if (!response?.ok) return setError(body?.error ?? 'Something went wrong. Try again.');
    setDone(true);
  }

  if (!token)
    return (
      <p className="text-center text-sm">
        This link is incomplete. <Link href="/forgot-password" className="font-medium text-primary-text hover:underline">Ask for a new one.</Link>
      </p>
    );

  if (done)
    return (
      <div className="space-y-4 text-center text-sm">
        <p>Your password was changed. You were signed out everywhere, including the extension.</p>
        <Link href="/login" className="font-medium text-primary-text hover:underline">Sign in</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="New password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-xs font-medium text-status-bad-foreground">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
        {busy ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  );
}
