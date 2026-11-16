import { Download } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { withBase } from '@/lib/base-path';
import { query } from '@/lib/db';
import { requirePageUser } from '@/lib/require-page-user';

export const dynamic = 'force-dynamic';

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await requirePageUser(`/s/${token}`);
  const [share] = await query<{ title: string; mime: string; kind: string; owner: string; created_at: Date }>(
    `select s.title, s.mime, s.kind, u.email as owner, s.created_at
     from shares s join users u on u.id = s.owner_id where s.token = $1 and s.revoked_at is null`,
    [token],
  );
  if (!share) notFound();
  const src = withBase(`/api/shares/file/${token}`);
  const pdf = share.mime === 'application/pdf';
  const frame = share.mime === 'text/html' || pdf;
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin={user.role === 'admin'} />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{share.title}</h1>
            <p className="text-xs text-muted-foreground">
              Shared by {share.owner} · {share.created_at.toLocaleString()}
            </p>
          </div>
          <a href={src} download className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-xs hover:bg-secondary">
            <Download size={14} /> Download
          </a>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {frame ? (
            <iframe
              title={share.title}
              src={src}
              {...(pdf ? {} : { sandbox: 'allow-scripts allow-popups' })}
              className="h-[78vh] w-full bg-white"
            />
          ) : share.mime.startsWith('video/') ? (
            <video src={src} controls className="max-h-[78vh] w-full bg-black" />
          ) : share.mime.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={share.title} className="mx-auto max-h-[78vh]" />
          ) : (
            <p className="px-6 py-16 text-center text-sm text-muted-foreground">This file type cannot be previewed. Use Download.</p>
          )}
        </div>
      </main>
    </>
  );
}
