'use client';

import { Check, Copy, ExternalLink, FileText, Film, Link2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui';
import { withBase } from '@/lib/base-path';

interface Share {
  id: string;
  title: string;
  kind: string;
  size: number;
  createdAt: string;
  url: string;
  ownerEmail: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SharesList({ admin }: { admin: boolean }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [copied, setCopied] = useState('');
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(withBase(`/api/shares${showAll ? '?all=1' : ''}`));
    if (response.ok) setShares((await response.json()).shares);
  }, [showAll]);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id: string) {
    if (!confirm('Revoke this link? Anyone who has it will lose access.')) return;
    await fetch(withBase(`/api/shares/${id}`), { method: 'DELETE' });
    void load();
  }

  async function copy(share: Share) {
    await navigator.clipboard.writeText(share.url);
    setCopied(share.id);
    setTimeout(() => setCopied(''), 1600);
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">Shared links</h2>
          <p className="text-xs text-muted-foreground">Only signed-in, approved users can open these.</p>
        </div>
        {admin && (
          <Button variant="outline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show mine' : 'Show everyone’s'}
          </Button>
        )}
      </div>
      {shares === null ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : shares.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-14 text-center">
          <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-icon-tile text-primary">
            <Link2 size={20} />
          </span>
          <p className="text-sm font-medium">Nothing shared yet</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">Open a guide in the FlowNote extension and press Share to create a link.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {shares.map((share) => (
            <li key={share.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                {share.kind === 'video' ? <Film size={16} /> : <FileText size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{share.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(share.createdAt).toLocaleString()} · {formatSize(share.size)}
                  {showAll && ` · ${share.ownerEmail}`}
                </div>
              </div>
              <Button variant="outline" onClick={() => copy(share)} className="h-8 px-3 text-xs">
                {copied === share.id ? <Check size={14} /> : <Copy size={14} />}
                {copied === share.id ? 'Copied' : 'Copy link'}
              </Button>
              <a href={share.url} target="_blank" rel="noreferrer" aria-label="Open" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <ExternalLink size={15} />
              </a>
              <button onClick={() => revoke(share.id)} aria-label="Revoke" className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
