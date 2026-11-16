import { i18n } from '@flownote/core/env';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

interface ShareResultProps {
  url: string | null;
  error: string | null;
}

export function ShareResult({ url, error }: ShareResultProps) {
  const [copied, setCopied] = useState(false);
  if (error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-1.5 rounded-lg bg-status-bad px-3 py-2 text-[11px] font-medium text-status-bad-foreground"
      >
        <TriangleAlert size={13} className="mt-px shrink-0" />
        {i18n.t('account.shareFailed', [error])}
      </p>
    );
  }
  if (!url) return null;
  return (
    <div className="space-y-1.5 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-text">
        <Check size={13} />
        {i18n.t('account.shareCopied')}
      </p>
      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="h-7 min-w-0 flex-1 rounded-md border border-border bg-card px-2 text-[11px] text-foreground outline-none"
        />
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-primary px-2 text-[11px] font-semibold text-primary-foreground"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {i18n.t('account.shareCopy')}
        </button>
      </div>
      <p className="text-[10.5px] text-muted-foreground">{i18n.t('account.shareHint')}</p>
    </div>
  );
}
