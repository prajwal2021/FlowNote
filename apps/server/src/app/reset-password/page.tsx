import { Suspense } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="At least 8 characters.">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
