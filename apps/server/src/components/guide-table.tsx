import { Download, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui';
import { withBase } from '@/lib/base-path';

export interface GuideRow {
  id: string;
  title: string;
  stepCount: number;
  updatedAt: Date | null;
  deleted: boolean;
  hasFiles: boolean;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
}

export function GuideTable({ rows, showOwner }: { rows: GuideRow[]; showOwner: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center px-5 py-14 text-center">
        <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-icon-tile text-primary">
          <FileText size={20} />
        </span>
        <p className="text-sm font-medium">No guides yet</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">Guides appear here automatically after they are recorded or saved in the FlowNote extension.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Guide</th>
            {showOwner && <th className="px-3 py-3 font-medium">Owner</th>}
            <th className="px-3 py-3 font-medium">Steps</th>
            <th className="px-3 py-3 font-medium">Last saved</th>
            <th className="px-5 py-3 text-right font-medium">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-secondary/40">
              <td className="px-5 py-3.5">
                <div className="font-medium">{row.title}</div>
                {row.deleted && (
                  <div className="mt-0.5">
                    <Badge tone="amber">Deleted by owner</Badge>
                  </div>
                )}
              </td>
              {showOwner && (
                <td className="px-3 py-3.5">
                  <Link href={`/admin/guides?owner=${row.ownerId}`} className="hover:underline">
                    {row.ownerName || row.ownerEmail}
                  </Link>
                  {row.ownerName && <div className="text-xs text-muted-foreground">{row.ownerEmail}</div>}
                </td>
              )}
              <td className="px-3 py-3.5 text-muted-foreground">{row.stepCount}</td>
              <td className="px-3 py-3.5 text-xs text-muted-foreground">{row.updatedAt ? row.updatedAt.toLocaleString() : '—'}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  {row.hasFiles ? (
                    <>
                      <Link href={`/guides/${row.id}`} aria-label="View" title="View" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <Eye size={15} />
                      </Link>
                      <a href={withBase(`/api/guides/file/${row.id}/bundle`)} aria-label="Download .flownote bundle" title="Download .flownote bundle" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <Download size={15} />
                      </a>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Syncing…</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
