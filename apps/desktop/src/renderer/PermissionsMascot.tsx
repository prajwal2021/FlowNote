import { BrandBadge } from '@flownote/ui';
import { ShieldCheck } from 'lucide-react';

export function PermissionsMascot({ granted }: { granted: boolean[] }) {
  return <BrandBadge size={64} icon={granted.every(Boolean) ? ShieldCheck : undefined} />;
}
