import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { ChangePasswordForm } from '@/components/change-password-form';
import { currentUser } from '@/lib/auth';

export default async function ChangePasswordPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return (
    <AuthShell
      title="Choose a new password"
      subtitle={user.mustChangePassword ? 'You were given a temporary password. Set your own to continue.' : 'Update your password.'}
    >
      <Suspense>
        <ChangePasswordForm />
      </Suspense>
    </AuthShell>
  );
}
