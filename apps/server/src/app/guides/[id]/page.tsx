import { Download } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { queryOne } from '@/lib/db';
import { requirePageUser } from '@/lib/require-page-user';
import { withBase } from '@/lib/base-path';

export const dynamic = 'force-dynamic';

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(`/guides/${id}`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const guide = await queryOne<{ title: string; owner_id: string; owner: string; client_updated_at: Date | null; has_files: boolean; deleted_by_user: boolean }>(
    `select g.title, g.owner_id, u.email as owner, g.client_updated_at, g.has_files, g.deleted_by_user
     from guides g join users u on u.id = g.owner_id where g.id = $1`,
    [id],
  );
  if (!guide || !guide.has_files || (guide.owner_id !== user.id && user.role !== 'admin')) notFound();
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin={user.role === 'admin'} />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{guide.title}</h1>
            <p className="text-xs text-muted-foreground">
              {guide.owner} · saved {guide.client_updated_at?.toLocaleString() ?? '—'}
              {guide.deleted_by_user && ' · deleted by owner'}
            </p>
          </div>
          <a href={withBase(`/api/guides/file/${id}/bundle`)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-xs hover:bg-secondary">
            <Download size={14} /> Download .flownote
          </a>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <iframe title={guide.title} src={withBase(`/api/guides/file/${id}/html`)} sandbox="allow-scripts allow-popups" className="h-[80vh] w-full bg-white" />
        </div>
      </main>
    </>
  );
}
