import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandBadge } from './brand-badge';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5 font-semibold">
        <BrandBadge size={28} />
        FlowNote
      </Link>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated {updated}</p>
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </main>
  );
}
