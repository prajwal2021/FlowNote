'use client';

import { Activity, Files, LogOut, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandBadge } from './brand-badge';
import { Badge } from './ui';
import { withBase } from '@/lib/base-path';

export function AppHeader({ name, email, admin }: { name: string; email: string; admin: boolean }) {
  const router = useRouter();
  async function signOut() {
    await fetch(withBase('/api/auth/logout'), { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <BrandBadge size={28} />
          FlowNote
        </Link>
        <nav className="ml-4 flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            Shared links
          </Link>
          <Link href="/guides" className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            My guides
          </Link>
          <Link href="/teams" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Users size={14} /> Teams
          </Link>
          {admin && (
            <Link href="/admin/guides" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Files size={14} /> All guides
            </Link>
          )}
          {admin && (
            <Link href="/admin/users" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <ShieldCheck size={14} /> Manage users
            </Link>
          )}
          {admin && (
            <Link href="/admin/activity" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Activity size={14} /> Activity
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-medium">{name || email}</div>
            <div className="text-[11px] text-muted-foreground">{email}</div>
          </div>
          {admin && <Badge tone="red">Admin</Badge>}
          <button onClick={signOut} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
