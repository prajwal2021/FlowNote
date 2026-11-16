import { i18n } from '@flownote/core/env';
import { Link2, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui/button';
import { sharing } from '../../env';
import { type ExportFormat, type GuideExport, SHAREABLE_FORMATS } from '../hooks/use-guide-export';

interface FormatRowProps {
  format: ExportFormat;
  label: string;
  icon: ReactNode;
  doc: GuideExport;
}

export function FormatRow({ format, label, icon, doc }: FormatRowProps) {
  const cancellable = doc.running === format && (format === 'video' || format === 'gif');
  const canShare = sharing.available() && SHAREABLE_FORMATS.includes(format);
  const sharingThis = doc.running === format && doc.runningMode === 'share';
  return (
    <div className="flex items-stretch gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        disabled={doc.running !== null && !cancellable}
        onClick={() => (cancellable ? doc.cancel() : doc.run(format))}
        className="min-w-0 flex-1 justify-start gap-2 border border-border hover:border-accent"
      >
        {doc.running === format && !sharingThis ? <Loader2 size={14} className="animate-spin" /> : icon}
        <span className="truncate">
          {cancellable
            ? i18n.t('exportMenu.cancelProgress', [String(Math.round(doc.progress * 100))])
            : i18n.t('exportPreview.download', [label])}
        </span>
      </Button>
      {canShare && (
        <Button
          size="sm"
          variant="outline"
          disabled={doc.running !== null}
          onClick={() => doc.run(format, 'share')}
          aria-label={`${i18n.t('account.shareLink')}: ${label}`}
          title={i18n.t('account.shareLink')}
          className="shrink-0 gap-1.5 border-primary/30 text-primary-text hover:border-primary"
        >
          {sharingThis ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          {i18n.t('account.share')}
        </Button>
      )}
    </div>
  );
}
