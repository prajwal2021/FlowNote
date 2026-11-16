import type { ReactNode } from 'react';
import { useAuth } from '@/ui/shared/hooks/use-auth';
import { ChangePasswordScreen } from './ChangePasswordScreen';
import { GuideSyncGate } from './GuideSyncGate';
import { LoginScreen } from './LoginScreen';

export function AuthGate({ children }: { children: ReactNode }) {
  const state = useAuth();
  if (state.status === 'loading') return null;
  if (state.status === 'signed-out') return <LoginScreen />;
  if (state.auth.user.mustChangePassword) return <ChangePasswordScreen />;
  return <GuideSyncGate>{children}</GuideSyncGate>;
}
