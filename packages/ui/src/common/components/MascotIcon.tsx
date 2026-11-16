import { FLOWNOTE_MARK } from '@flownote/core/brand/flownote-mark';

interface MascotIconProps {
  size?: number;
  tone?: 'brand' | 'muted';
}

export function MascotIcon({ size = 22, tone = 'brand' }: MascotIconProps) {
  const muted = tone === 'muted';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`block shrink-0 ${muted ? 'opacity-55' : 'text-primary'}`}
      aria-hidden="true"
    >
      <path
        d={FLOWNOTE_MARK}
        fill="none"
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
