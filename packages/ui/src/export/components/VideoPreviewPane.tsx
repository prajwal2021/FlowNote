import { i18n } from '@flownote/core/env';
import { STEP_SECONDS } from '@flownote/core/export/video-support';
import { Video } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Button } from '../../components/ui/button';
import type { VideoPreview } from '../hooks/use-video-preview';
import { VideoLoader } from './VideoLoader';

const VideoStepPlayer = lazy(() => import('./VideoStepPlayer').then((m) => ({ default: m.VideoStepPlayer })));

interface VideoPreviewPaneProps {
  video: VideoPreview;
  stepCount: number;
  voiceover: boolean;
}

export function VideoPreviewPane({ video, stepCount, voiceover }: VideoPreviewPaneProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {video.deferred ? (
        <div className="max-w-[340px] flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-5 py-4 text-center">
          <Video size={20} className="text-accent" />
          <div className="text-[12px] font-semibold text-foreground">
            {i18n.t('exportPreview.videoReady', [
              String(stepCount),
              String(Math.round((stepCount * STEP_SECONDS) / 60)),
            ])}
          </div>
          <div className="text-[11px] text-muted-foreground leading-snug">{i18n.t('exportPreview.videoReadyHint')}</div>
          <Button size="sm" className="mt-1" onClick={video.request}>
            {i18n.t('exportPreview.videoGenerate')}
          </Button>
        </div>
      ) : video.error ? (
        <div className="max-w-[320px] rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="text-[12px] font-semibold text-foreground">{i18n.t('exportPreview.videoFailed')}</div>
          <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{video.error}</div>
        </div>
      ) : video.url ? (
        <Suspense fallback={null}>
          <VideoStepPlayer
            key={video.url}
            src={video.url}
            type={video.mime}
            chapters={video.chapters}
            narrated={voiceover && !video.voiceoverError}
          />
        </Suspense>
      ) : (
        <VideoLoader stage={video.stage} narrating={video.narrating} progress={video.progress} stepCount={stepCount} />
      )}
    </div>
  );
}
