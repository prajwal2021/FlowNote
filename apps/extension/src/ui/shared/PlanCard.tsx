import { i18n } from '@flownote/core/env';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { openServerPage } from '@/lib/auth/open-server-page';
import { openBilling } from '@/lib/billing/open-billing';
import { useUsage } from './hooks/use-usage';

export function PlanCard() {
  const usage = useUsage();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!usage) return null;
  const pro = usage.plan === 'pro';

  const open = async () => {
    setBusy(true);
    setError((await openBilling(pro)) ?? '');
    setBusy(false);
  };

  return (
    <div className="space-y-2 rounded-lg bg-secondary px-3 py-2.5 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <Sparkles size={12} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate">
          {pro
            ? i18n.t('billing.planPro')
            : usage.recordingLimit === null
              ? i18n.t('billing.planFree')
              : i18n.t('billing.planFreeUsage', [
                  String(Math.min(usage.recordingsUsed, usage.recordingLimit)),
                  String(usage.recordingLimit),
                ])}
        </span>
        {usage.billingEnabled && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void open()}
            className="shrink-0 rounded-md px-2 py-1 font-semibold text-foreground transition-colors hover:bg-card disabled:opacity-50"
          >
            {i18n.t(pro ? 'billing.manage' : 'billing.upgrade')}
          </button>
        )}
        <button
          type="button"
          onClick={() => void openServerPage('/account')}
          className="shrink-0 rounded-md px-2 py-1 font-semibold text-foreground transition-colors hover:bg-card"
        >
          {i18n.t('billing.account')}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-status-bad-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
