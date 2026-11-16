import { i18n } from '@flownote/core/env';
import { FileText, Video } from 'lucide-react';

export type GuideView = 'document' | 'video';

interface GuideViewToggleProps {
  view: GuideView;
  onChange: (view: GuideView) => void;
}

export function GuideViewToggle({ view, onChange }: GuideViewToggleProps) {
  const options = [
    { key: 'document' as const, icon: FileText, label: i18n.t('exportPreview.modeDocument') },
    { key: 'video' as const, icon: Video, label: i18n.t('exportPreview.modeVideo') },
  ];
  return (
    <div role="tablist" className="mb-4 inline-flex rounded-xl border border-border bg-secondary p-1">
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={view === key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
            view === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
