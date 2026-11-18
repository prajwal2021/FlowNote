import { i18n } from '@flownote/core/env';
import { Button } from '@flownote/ui';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { openBilling } from '@/lib/billing/open-billing';
import { useUsage } from '@/ui/shared/hooks/use-usage';

export function UpgradeNotice() {
  const usage = useUsage();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!usage?.blocked || usage.plan === 'pro') return null;

  const upgrade = async () => {
    setBusy(true);
    setError((await openBilling(false)) ?? '');
    setBusy(false);
  };

  return (
    <div role="status" className="mt-2.5 space-y-2 rounded-lg border border-border bg-secondary p-3 text-xs">
      <p className="font-semibold text-foreground">{i18n.t('billing.limitTitle')}</p>
      <p className="text-muted-foreground">
        {i18n.t('billing.limitBody', [String(usage.recordingLimit ?? usage.recordingsUsed)])}
      </p>
      <Button size="sm" disabled={busy} onClick={() => void upgrade()} className="w-full">
        <Sparkles size={14} />
        {i18n.t('billing.upgrade')}
      </Button>
      {error && (
        <p role="alert" className="text-status-bad-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
