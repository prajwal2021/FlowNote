import { BrandBadge } from './BrandBadge';

interface CameraMascotProps {
  size?: number;
  flash?: 'loop' | 'off' | 'shutter';
}

export function CameraMascot({ size = 64, flash = 'loop' }: CameraMascotProps) {
  return <BrandBadge size={size} flash={flash !== 'off'} pulse={flash === 'shutter'} />;
}
