import { downloadBlob, safeFilename } from '@flownote/core/export/download';
import { exportGuideAsHTML } from '@flownote/core/export/html-export';
import { DEFAULT_EXPORT_OPTIONS, type ExportOptions } from '@flownote/core/export/options';
import { exportGuideAsPDF } from '@flownote/core/export/pdf-export';
import { withPreviewStyles } from '@flownote/core/export/preview';
import type { VoiceoverSkip } from '@flownote/core/export/video-export';
import type { Guide, Screenshot, Step } from '@flownote/core/guides/types';
import { BUNDLE_EXTENSION } from '@flownote/core/transfer/schema';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sharing } from '../../env';
import { exportProgress, MUX_PROGRESS_SHARE, VOICE_PROGRESS_SHARE } from '../lib/export-progress';

export type ExportFormat = 'bundle' | 'demo' | 'docx' | 'gif' | 'html' | 'markdown' | 'pdf' | 'video';

type ExportMode = 'download' | 'share';

export const SHAREABLE_FORMATS: readonly ExportFormat[] = ['pdf', 'docx', 'html', 'demo', 'gif', 'video'];

export interface GuideExport {
  html: string;
  rendering: boolean;
  running: ExportFormat | null;
  runningMode: ExportMode | null;
  progress: number;
  voiceoverError: VoiceoverSkip | null;
  shareUrl: string | null;
  shareError: string | null;
  run: (format: ExportFormat, mode?: ExportMode) => Promise<void>;
  cancel: () => void;
}

interface Params {
  active: boolean;
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
  options: ExportOptions;
  voiceover: boolean;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export function useGuideExport({ active, guide, steps, screenshots, options, voiceover }: Params): GuideExport {
  const [html, setHtml] = useState('');
  const [rendering, setRendering] = useState(false);
  const [running, setRunning] = useState<ExportFormat | null>(null);
  const [progress, setProgress] = useState(0);
  const [voiceoverError, setVoiceoverError] = useState<VoiceoverSkip | null>(null);
  const [runningMode, setRunningMode] = useState<ExportMode | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const { cover, screenshots: withScreenshots, stepUrls, imageScale, screenshotStyle, stepDescriptions } = options;
  const previewOptions = useMemo<ExportOptions>(
    () => ({
      ...DEFAULT_EXPORT_OPTIONS,
      cover,
      screenshots: withScreenshots,
      stepUrls,
      imageScale,
      screenshotStyle,
      stepDescriptions,
    }),
    [cover, withScreenshots, stepUrls, imageScale, screenshotStyle, stepDescriptions],
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setRendering(true);
    const timer = setTimeout(async () => {
      const built = await exportGuideAsHTML(guide, steps, screenshots, previewOptions);
      if (cancelled) return;
      setHtml(withPreviewStyles(built));
      setRendering(false);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, guide, steps, screenshots, previewOptions]);

  const run = async (format: ExportFormat, mode: ExportMode = 'download') => {
    setRunning(format);
    setRunningMode(mode);
    setShareUrl(null);
    setShareError(null);
    const deliver = async (blob: Blob, filename: string) => {
      if (mode === 'download') {
        downloadBlob(blob, filename);
        return;
      }
      const typed = blob.type ? blob : new Blob([blob], { type: MIME_BY_EXTENSION[filename.split('.').pop() ?? ''] });
      try {
        const { url } = await sharing.upload(typed, {
          title: guide.title,
          kind: format === 'video' ? 'video' : format === 'gif' ? 'file' : 'document',
          fileName: filename,
        });
        setShareUrl(url);
        await navigator.clipboard.writeText(url).catch(() => undefined);
      } catch (error) {
        setShareError(error instanceof Error ? error.message : String(error));
      }
    };
    try {
      if (format === 'html') {
        const built = await exportGuideAsHTML(guide, steps, screenshots, options);
        await deliver(new Blob([built], { type: 'text/html' }), safeFilename(guide.title, 'html'));
      } else if (format === 'pdf') {
        await deliver(await exportGuideAsPDF(guide, steps, screenshots, options), safeFilename(guide.title, 'pdf'));
      } else if (format === 'docx') {
        const { exportGuideAsDOCX } = await import('@flownote/core/export/docx-export');
        await deliver(await exportGuideAsDOCX(guide, steps, screenshots, options), safeFilename(guide.title, 'docx'));
      } else if (format === 'demo') {
        const { exportGuideAsDemo } = await import('@flownote/core/export/demo-export');
        const built = await exportGuideAsDemo(guide, steps, screenshots, options);
        await deliver(new Blob([built], { type: 'text/html' }), safeFilename(guide.title, 'html'));
      } else if (format === 'markdown') {
        const { exportGuideAsMarkdown } = await import('@flownote/core/export/markdown-export');
        const md = await exportGuideAsMarkdown(guide, steps, screenshots);
        await deliver(new Blob([md], { type: 'text/markdown' }), safeFilename(guide.title, 'md'));
      } else if (format === 'bundle') {
        const { exportGuideAsBundle } = await import('@flownote/core/transfer/bundle');
        const blob = await exportGuideAsBundle(guide, steps, screenshots, {
          stripInputValues: options.bundleStripInputs,
          urls: options.bundleUrls,
        });
        await deliver(blob, safeFilename(guide.title, BUNDLE_EXTENSION));
      } else if (format === 'gif') {
        const controller = new AbortController();
        abort.current = controller;
        setProgress(0);
        const { exportGuideAsGif } = await import('@flownote/core/export/gif-export');
        const built = await exportGuideAsGif(guide, steps, screenshots, options, {
          signal: controller.signal,
          onProgress: (encoded, frames) => setProgress(frames > 0 ? encoded / frames : 0),
        });
        if (controller.signal.aborted) return;
        await deliver(built.blob, safeFilename(guide.title, built.extension));
      } else {
        const controller = new AbortController();
        abort.current = controller;
        setProgress(0);
        setVoiceoverError(null);
        const voiceShare = voiceover ? VOICE_PROGRESS_SHARE : 0;
        const muxShare = voiceover ? MUX_PROGRESS_SHARE : 0;
        let allClipsLanded = false;
        const { exportGuideAsVideo } = await import('@flownote/core/export/video-export');
        const built = await exportGuideAsVideo(
          guide,
          steps,
          screenshots,
          { ...options, voiceover },
          {
            signal: controller.signal,
            onProgress: (encoded, frames) =>
              setProgress(
                exportProgress.encode(encoded, frames, allClipsLanded ? voiceShare : 0, allClipsLanded ? muxShare : 0),
              ),
            onVoiceProgress: (done, total) => {
              allClipsLanded = done === total;
              setProgress(exportProgress.narrate(done, total, voiceShare));
            },
            onMuxProgress: (done, total) => setProgress(exportProgress.mux(done, total, muxShare)),
          },
        );
        if (controller.signal.aborted) return;
        setVoiceoverError(built.voiceoverError ?? null);
        await deliver(built.blob, safeFilename(guide.title, built.extension));
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
    } finally {
      abort.current = null;
      setRunning(null);
      setRunningMode(null);
    }
  };

  return {
    html,
    rendering,
    running,
    runningMode,
    progress,
    voiceoverError,
    shareUrl,
    shareError,
    run,
    cancel: () => abort.current?.abort(),
  };
}
