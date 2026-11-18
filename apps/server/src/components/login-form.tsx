'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { GoogleButton } from './google-button';
import { Button, Field } from './ui';
import { withBase } from '@/lib/base-path';

export function LoginForm({ mode }: { mode: 'signin' | 'signup' }) {
  const signup = mode === 'signup';
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('error') ?? '');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch(withBase(signup ? '/api/auth/signup' : '/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error ?? (signup ? 'Could not create the account.' : 'Could not sign in.'));
      setBusy(false);
      return;
    }
    const next = params.get('next');
    router.replace(body.user.mustChangePassword ? `/change-password?next=${encodeURIComponent(next ?? '/')}` : next?.startsWith('/') ? next : '/');
    router.refresh();
  }

  const next = params.get('next');
  return (
    <div className="space-y-4">
      <GoogleButton next={next?.startsWith('/') ? next : '/'} />
      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-xs font-medium text-status-bad-foreground">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
        {signup ? (busy ? 'Creating account…' : 'Create account') : busy ? 'Signing in…' : 'Sign in'}
      </Button>
      {!signup && (
        <p className="text-center text-xs">
          <Link href="/forgot-password" className="font-medium text-primary-text hover:underline">
            Forgot password?
          </Link>
        </p>
      )}
      {signup && (
        <p className="text-center text-[11px] text-muted-foreground">
          By creating an account you agree to the{' '}
          <Link href="/terms" className="underline">Terms</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      )}
    </form>
    </div>
  );
}
