import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandBadge } from './brand-badge';

export function AuthShell({
  title,
  subtitle,
  mode,
  children,
}: { title: string; subtitle: string; mode?: 'signin' | 'signup'; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandBadge size={64} />
          <h1 className="mt-5 text-2xl font-semibold">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-black/[0.03]">{children}</div>
        {mode === 'signin' && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to FlowNote?{' '}
            <Link href="/signup" className="font-medium text-primary-text hover:underline">
              Create an account
            </Link>
          </p>
        )}
        {mode === 'signup' && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-text hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
