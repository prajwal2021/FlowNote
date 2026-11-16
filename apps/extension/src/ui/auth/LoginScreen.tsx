import { i18n } from '@flownote/core/env';
import { BrandBadge, Button, Input } from '@flownote/ui';
import { type FormEvent, useState } from 'react';
import { signIn } from '@/lib/auth/sign-in';
import { signUp } from '@/lib/auth/sign-up';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await (creating ? signUp : signIn)(email, password);
    if (result.error) setError(result.error);
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandBadge size={60} />
          <h1 className="mt-5 text-xl font-semibold">
            {i18n.t(creating ? 'account.signUpTitle' : 'account.signInTitle')}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {i18n.t(creating ? 'account.signUpSubtitle' : 'account.signInSubtitle')}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">{i18n.t('account.email')}</span>
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">{i18n.t('account.password')}</span>
            <Input
              type="password"
              autoComplete={creating ? 'new-password' : 'current-password'}
              minLength={creating ? 8 : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-status-bad px-3 py-2 text-xs font-medium text-status-bad-foreground"
            >
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} size="lg" className="w-full">
            {creating
              ? i18n.t(busy ? 'account.creatingAccount' : 'account.createAccount')
              : i18n.t(busy ? 'account.signingIn' : 'account.signIn')}
          </Button>
        </form>
        <p className="mt-5 text-center text-[12.5px] text-muted-foreground">
          {i18n.t(creating ? 'account.haveAccount' : 'account.noAccount')}{' '}
          <button
            type="button"
            onClick={() => {
              setCreating(!creating);
              setError('');
            }}
            className="font-semibold text-primary hover:underline"
          >
            {i18n.t(creating ? 'account.signIn' : 'account.createAccount')}
          </button>
        </p>
        <p className="mt-2 text-center text-[11.5px] text-muted-foreground">{i18n.t('account.syncNotice')}</p>
      </div>
    </main>
  );
}
