'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { Button, Field } from './ui';
import { withBase } from '@/lib/base-path';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch(withBase('/api/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const body = await response?.json().catch(() => ({}));
    setBusy(false);
    if (!response?.ok) return setError(body?.error ?? 'Something went wrong. Try again.');
    setSent(true);
  }

  if (sent)
    return (
      <div className="space-y-4 text-center text-sm">
        <p>If an account exists for <strong>{email}</strong>, we sent a link to reset its password. It works for one hour.</p>
        <Link href="/login" className="font-medium text-primary-text hover:underline">Back to sign in</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-xs font-medium text-status-bad-foreground">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
        {busy ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-center text-xs">
        <Link href="/login" className="font-medium text-primary-text hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}
