import { i18n } from '@flownote/core/env';
import { DEFAULT_EXPORT_OPTIONS, type ExportOptions, loadExportOptions } from '@flownote/core/export/options';
import type { Guide, Screenshot, Step } from '@flownote/core/guides/types';
import { TriangleAlert, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Switch } from '../../common/components/Switch';
import { VideoPreviewPane } from '../../export/components/VideoPreviewPane';
import { useVideoPreview } from '../../export/hooks/use-video-preview';
import { useVoiceoverReady } from '../../export/hooks/use-voiceover-ready';
import { VOICEOVER_SKIP_MESSAGES } from '../../export/lib/voiceover-skip-messages';

interface GuideVideoPaneProps {
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
}

export function GuideVideoPane({ guide, steps, screenshots }: GuideVideoPaneProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [wantsVoice, setWantsVoice] = useState(false);
  const ready = useVoiceoverReady(true);
  const voiceover = wantsVoice && ready;
  useEffect(() => {
    void loadExportOptions().then(setOptions);
  }, []);
  const video = useVideoPreview({ active: true, guide, steps, screenshots, options, voiceover });
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-icon-tile text-primary">
          <Volume2 size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground">{i18n.t('exportPreview.voiceover')}</p>
          <p className="text-[11.5px] leading-snug text-muted-foreground">
            {i18n.t(ready ? 'exportPreview.voiceoverHint' : 'exportPreview.voiceoverNoKey')}
          </p>
        </div>
        <Switch
          checked={voiceover}
          disabled={!ready}
          label={i18n.t('exportPreview.voiceover')}
          onChange={setWantsVoice}
        />
      </div>
      {video.voiceoverError && (
        <p className="flex items-start gap-1.5 rounded-lg bg-status-bad px-3 py-2 text-[11.5px] font-medium text-status-bad-foreground">
          <TriangleAlert size={13} className="mt-px shrink-0" />
          {i18n.t(VOICEOVER_SKIP_MESSAGES[video.voiceoverError.reason])}
        </p>
      )}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <VideoPreviewPane video={video} stepCount={steps.length} voiceover={voiceover} />
      </div>
    </div>
  );
}
