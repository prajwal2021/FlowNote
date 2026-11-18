import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { BillingActions } from '@/components/billing-actions';
import { DeleteAccount } from '@/components/delete-account';
import { usageFor } from '@/lib/billing';
import { queryOne } from '@/lib/db';
import { requirePageUser } from '@/lib/require-page-user';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePageUser('/account');
  const { status } = await searchParams;
  const usage = await usageFor(user.id);
  const account = await queryOne<{ has_password: boolean; google: boolean }>(
    'select password_hash is not null as has_password, google_sub is not null as google from users where id = $1',
    [user.id],
  );
  const pro = usage?.plan === 'pro';
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin={user.role === 'admin'} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">Account</h1>
        {status === 'success' && (
          <p className="rounded-lg bg-status-good px-4 py-3 text-sm font-medium text-status-good-foreground">
            Thanks! FlowNote Pro is active. Go back to the extension to keep recording.
          </p>
        )}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Plan</h2>
          <p className="text-sm text-muted-foreground">
            {pro
              ? `FlowNote Pro: unlimited recordings.${usage?.renewsAt ? ` Renews or ends on ${new Date(usage.renewsAt).toLocaleDateString('en')}.` : ''}`
              : usage?.recordingLimit != null
                ? `Free plan: ${Math.min(usage.recordingsUsed, usage.recordingLimit)} of ${usage.recordingLimit} free recordings used.`
                : 'Free plan.'}
          </p>
          {usage?.billingEnabled && user.role !== 'admin' && <BillingActions pro={pro} />}
        </section>
        <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Sign-in</h2>
          <p className="text-sm text-muted-foreground">
            {user.email}
            {account?.google ? ' · Google connected' : ''}
          </p>
          <Link
            href={account?.has_password ? '/change-password?next=/account' : '/forgot-password'}
            className="inline-block text-sm font-medium text-primary-text hover:underline"
          >
            {account?.has_password ? 'Change password' : 'Add a password'}
          </Link>
        </section>
        {user.role !== 'admin' && (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Delete account</h2>
            <DeleteAccount email={user.email} hasPassword={account?.has_password ?? false} />
          </section>
        )}
      </main>
    </>
  );
}
