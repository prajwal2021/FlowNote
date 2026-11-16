import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { GuideTable } from '@/components/guide-table';
import { query } from '@/lib/db';
import { listGuides } from '@/lib/list-guides';
import { requirePageUser } from '@/lib/require-page-user';

export const dynamic = 'force-dynamic';

export default async function AllGuidesPage({ searchParams }: { searchParams: Promise<{ owner?: string; q?: string }> }) {
  const user = await requirePageUser('/admin/guides');
  if (user.role !== 'admin') redirect('/');
  const { owner, q } = await searchParams;
  const ownerId = owner && /^[0-9a-f-]{36}$/.test(owner) ? owner : undefined;
  const [rows, users] = await Promise.all([
    listGuides({ ownerId, q: q?.trim() || undefined }),
    query<{ id: string; email: string; name: string }>('select id, email, name from users order by email'),
  ]);
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">All guides</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everything every user has recorded or saved, including guides they later deleted.</p>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search titles"
            className="h-9 w-64 rounded-lg border border-input bg-field px-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
          />
          <select
            name="owner"
            defaultValue={ownerId ?? ''}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ? `${u.name} (${u.email})` : u.email}
              </option>
            ))}
          </select>
          <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90">Filter</button>
        </form>
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <GuideTable rows={rows} showOwner />
        </section>
      </main>
    </>
  );
}
