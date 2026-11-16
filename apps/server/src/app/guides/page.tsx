import { AppHeader } from '@/components/app-header';
import { GuideTable } from '@/components/guide-table';
import { listGuides } from '@/lib/list-guides';
import { requirePageUser } from '@/lib/require-page-user';

export const dynamic = 'force-dynamic';

export default async function MyGuidesPage() {
  const user = await requirePageUser('/guides');
  const rows = (await listGuides({ ownerId: user.id })).filter((row) => !row.deleted);
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin={user.role === 'admin'} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">My guides</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everything you record or save in the extension is backed up here.</p>
        </div>
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <GuideTable rows={rows} showOwner={false} />
        </section>
      </main>
    </>
  );
}
