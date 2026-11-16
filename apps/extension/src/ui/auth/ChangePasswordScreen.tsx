import { i18n } from '@flownote/core/env';
import { BrandBadge, Button, Input } from '@flownote/ui';
import { type FormEvent, useState } from 'react';
import { changePassword } from '@/lib/auth/change-password';

export function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm) {
      setError(i18n.t('account.passwordMismatch'));
      return;
    }
    setBusy(true);
    setError('');
    const problem = await changePassword(current, next);
    if (problem) setError(problem);
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandBadge size={60} />
          <h1 className="mt-5 text-xl font-semibold">{i18n.t('account.changeTitle')}</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">{i18n.t('account.changeSubtitle')}</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">{i18n.t('account.currentPassword')}</span>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="h-10"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">{i18n.t('account.newPassword')}</span>
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="h-10"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">{i18n.t('account.confirmPassword')}</span>
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {i18n.t('account.updatePassword')}
          </Button>
        </form>
      </div>
    </main>
  );
}
