import { FLOWNOTE_MARK } from '@flownote/core/brand/flownote-mark';
import type { LucideIcon } from 'lucide-react';

interface BrandBadgeProps {
  size?: number;
  icon?: LucideIcon;
  pulse?: boolean;
  flash?: boolean;
  className?: string;
}

export function BrandBadge({ size = 96, icon: Icon, pulse = false, flash = false, className = '' }: BrandBadgeProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-[28%] bg-linear-to-br from-primary to-[#7F0000] shadow-lg shadow-primary/30 ring-1 ring-inset ring-white/15 ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      <svg viewBox="0 0 100 100" width={size * 0.62} height={size * 0.62} className="block">
        <path
          d={FLOWNOTE_MARK}
          fill="none"
          stroke="#fff"
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {flash && (
        <span className="absolute inset-0 rounded-[28%] bg-white opacity-0 animate-[cam-flash_3s_ease_infinite]" />
      )}
      {Icon && (
        <span className="absolute -right-1.5 -bottom-1.5 flex items-center justify-center rounded-full bg-card p-1.5 text-primary shadow-md ring-1 ring-border">
          <Icon size={Math.max(12, size * 0.18)} />
        </span>
      )}
    </span>
  );
}
