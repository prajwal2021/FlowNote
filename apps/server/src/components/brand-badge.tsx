import { FLOWNOTE_MARK } from '@/lib/flownote-mark';

export function BrandBadge({ size = 56 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-[28%] bg-linear-to-br from-primary to-[#7F0000] shadow-lg shadow-primary/30 ring-1 ring-inset ring-white/15"
    >
      <svg viewBox="0 0 100 100" width={size * 0.62} height={size * 0.62}>
        <path
          d={FLOWNOTE_MARK}
          fill="none"
          stroke="#fff"
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
