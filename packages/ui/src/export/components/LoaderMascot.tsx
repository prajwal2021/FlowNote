import { BrandBadge } from '../../common/components/BrandBadge';

export function LoaderMascot({ filming, size = 128 }: { filming: boolean; size?: number }) {
  return <BrandBadge size={size * 0.75} pulse={filming} />;
}
