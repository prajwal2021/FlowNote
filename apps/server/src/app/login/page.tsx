import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/components/login-form';
import { currentUser } from '@/lib/auth';

export default async function LoginPage() {
  if (await currentUser()) redirect('/');
  return (
    <AuthShell title="Sign in to FlowNote" subtitle="Welcome back." mode="signin">
      <Suspense>
        <LoginForm mode="signin" />
      </Suspense>
    </AuthShell>
  );
}
