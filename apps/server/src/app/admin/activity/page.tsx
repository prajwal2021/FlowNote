import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { query } from '@/lib/db';
import { requirePageUser } from '@/lib/require-page-user';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  'auth.login': 'Signed in',
  'auth.login-failed': 'Failed sign-in',
  'auth.login-blocked-frozen': 'Blocked (frozen account)',
  'password.change': 'Changed password',
  'user.create': 'User created',
  'user.update': 'User updated',
  'user.delete': 'User removed',
  'user.reset-password': 'Password reset',
  'share.revoke': 'Share link revoked',
};

export default async function ActivityPage() {
  const user = await requirePageUser('/admin/activity');
  if (user.role !== 'admin') redirect('/');
  const rows = await query<{ at: Date; action: string; target: string | null; actor: string | null }>(
    `select a.at, a.action, a.target, u.email as actor from audit_log a left join users u on u.id = a.actor_id order by a.at desc limit 300`,
  );
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign-ins and account changes, newest first.</p>
        </div>
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-3 py-3 font-medium">User</th>
                <th className="px-3 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-secondary/40">
                  <td className="px-5 py-3 text-xs text-muted-foreground">{row.at.toLocaleString()}</td>
                  <td className="px-3 py-3">{row.actor ?? '—'}</td>
                  <td className="px-3 py-3 font-medium">{LABELS[row.action] ?? row.action}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{row.target ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
