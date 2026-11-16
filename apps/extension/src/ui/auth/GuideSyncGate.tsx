import type { ReactNode } from 'react';
import { useGuideSync } from '@/ui/shared/hooks/use-guide-sync';

export function GuideSyncGate({ children }: { children: ReactNode }) {
  useGuideSync();
  return <>{children}</>;
}
