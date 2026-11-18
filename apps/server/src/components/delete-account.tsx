'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, Field } from './ui';
import { withBase } from '@/lib/base-path';

export function DeleteAccount({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch(withBase('/api/auth/me'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hasPassword ? { password: value } : { confirm: value }),
    }).catch(() => null);
    const body = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      setError(body?.error ?? 'Something went wrong. Try again.');
      setBusy(false);
      return;
    }
    router.replace('/login');
    router.refresh();
  }

  if (!open)
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Delete account
      </Button>
    );

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      <p className="text-sm">
        This deletes your account, your backed-up guides and your share links, and cancels any subscription. It can't be undone.
      </p>
      <Field
        label={hasPassword ? 'Enter your password to confirm' : `Type ${email} to confirm`}
        type={hasPassword ? 'password' : 'text'}
        autoComplete={hasPassword ? 'current-password' : 'off'}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-xs font-medium text-status-bad-foreground">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={busy}>
          {busy ? 'Deleting…' : 'Delete my account'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
