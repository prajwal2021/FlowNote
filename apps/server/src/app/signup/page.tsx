import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { LoginForm } from '@/components/login-form';
import { currentUser } from '@/lib/auth';

export default async function SignUpPage() {
  if (await currentUser()) redirect('/');
  return (
    <AuthShell title="Create your FlowNote account" subtitle="Start free. No card needed." mode="signup">
      <Suspense>
        <LoginForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
