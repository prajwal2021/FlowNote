import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface SettingsCardProps {
  icon?: LucideIcon;
  title?: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function SettingsCard({ icon: Icon, title, hint, action, className, children }: SettingsCardProps) {
  return (
    <div
      className={cn(
        'border border-border rounded-2xl bg-card p-4 space-y-3.5 shadow-sm shadow-black/[0.03] transition-shadow hover:shadow-md hover:shadow-black/[0.05]',
        className,
      )}
    >
      {title && (
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-[10px] bg-icon-tile flex items-center justify-center shrink-0 ring-1 ring-primary/15">
              <Icon size={14} className="text-accent" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-foreground">{title}</div>
            {hint && <div className="text-[11.5px] leading-snug text-muted-foreground">{hint}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
