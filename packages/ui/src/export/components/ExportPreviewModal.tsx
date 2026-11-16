import { i18n } from '@flownote/core/env';
import {
  BUNDLE_URL_MODES,
  DEFAULT_EXPORT_OPTIONS,
  type ExportOptions,
  GIF_QUALITIES,
  type ImageScale,
  loadExportOptions,
  saveExportOptions,
  VIDEO_RESOLUTIONS,
} from '@flownote/core/export/options';
import { paginatePreview } from '@flownote/core/export/preview';
import type { Guide, Screenshot, Step } from '@flownote/core/guides/types';
import { SCREENSHOT_STYLES } from '@flownote/core/screenshot/screenshot-style';
import {
  FileCode,
  FileDown,
  FileImage,
  FileText,
  Loader2,
  MousePointerClick,
  Package,
  TriangleAlert,
  Video,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { OptionPills } from '../../common/components/OptionPills';
import { Switch } from '../../common/components/Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useScreenshotStyle } from '../../stores/use-screenshot-style';
import { type ExportFormat, useGuideExport } from '../hooks/use-guide-export';
import { useVideoPreview } from '../hooks/use-video-preview';
import { useVoiceoverReady } from '../hooks/use-voiceover-ready';
import { VOICEOVER_SKIP_MESSAGES } from '../lib/voiceover-skip-messages';
import { FormatRow } from './FormatRow';
import { ShareResult } from './ShareResult';
import { VideoPreviewPane } from './VideoPreviewPane';

const IMAGE_SCALES: ImageScale[] = ['small', 'medium', 'large'];

interface ExportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
}

type PreviewMode = 'document' | 'video';

export function ExportPreviewModal({ open, onOpenChange, guide, steps, screenshots }: ExportPreviewModalProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [mode, setMode] = useState<PreviewMode>('document');

  useEffect(() => {
    if (open) loadExportOptions().then(setOptions);
    else setOptions((current) => (current.voiceover ? { ...current, voiceover: false } : current));
  }, [open]);

  const voiceoverReady = useVoiceoverReady(open);
  const voiceover = options.voiceover && voiceoverReady;
  const doc = useGuideExport({ active: open && mode === 'document', guide, steps, screenshots, options, voiceover });
  const video = useVideoPreview({ active: open && mode === 'video', guide, steps, screenshots, options, voiceover });
  const voiceoverError = doc.voiceoverError ?? video.voiceoverError;
  const typedStepCount = steps.filter((step) => step.inputValue && screenshots.has(step.id)).length;

  const update = (patch: Partial<ExportOptions>) => {
    const next = { ...options, ...patch };
    setOptions(next);
    void saveExportOptions(next);
  };

  const toggles: Array<{ key: keyof ExportOptions; label: string; hint: string }> = [
    { key: 'cover', label: i18n.t('exportPreview.cover'), hint: i18n.t('exportPreview.coverHint') },
    { key: 'screenshots', label: i18n.t('exportPreview.screenshots'), hint: i18n.t('exportPreview.screenshotsHint') },
    { key: 'stepUrls', label: i18n.t('exportPreview.stepUrls'), hint: i18n.t('exportPreview.stepUrlsHint') },
    {
      key: 'stepDescriptions',
      label: i18n.t('exportPreview.stepDescriptions'),
      hint: i18n.t('exportPreview.stepDescriptionsHint'),
    },
    { key: 'stepNumbers', label: i18n.t('exportPreview.stepNumbers'), hint: i18n.t('exportPreview.stepNumbersHint') },
  ];

  const modes: Array<{ key: PreviewMode; icon: typeof FileText; label: string }> = [
    { key: 'document', icon: FileText, label: i18n.t('exportPreview.modeDocument') },
    { key: 'video', icon: Video, label: i18n.t('exportPreview.modeVideo') },
  ];

  const formats: Array<{ key: ExportFormat; icon: typeof FileText; label: string }> = [
    { key: 'pdf', icon: FileDown, label: i18n.t('exportMenu.pdf') },
    { key: 'docx', icon: FileText, label: i18n.t('exportMenu.docx') },
    { key: 'html', icon: FileCode, label: i18n.t('exportMenu.html') },
    { key: 'markdown', icon: FileText, label: i18n.t('exportMenu.markdown') },
    { key: 'demo', icon: MousePointerClick, label: i18n.t('exportMenu.demo') },
    { key: 'gif', icon: FileImage, label: i18n.t('exportMenu.gif') },
    ...(video.supported ? [{ key: 'video' as const, icon: Video, label: i18n.t('exportMenu.video') }] : []),
    { key: 'bundle', icon: Package, label: i18n.t('exportMenu.bundle') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[96vw] max-w-[96vw] sm:max-w-[1180px] p-0 gap-0 overflow-hidden"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        <DialogHeader className="px-5 py-3.5 border-b border-border">
          <DialogTitle className="text-[15px] font-bold">{i18n.t('exportPreview.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex h-[74vh] min-h-[420px]">
          <div className="w-[268px] shrink-0 border-r border-border p-4 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              {toggles.map(({ key, label, hint }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-foreground">{label}</div>
                    <div className="text-[10px] text-muted-foreground leading-snug">{hint}</div>
                  </div>
                  <div className="mt-0.5 flex shrink-0">
                    <Switch
                      checked={Boolean(options[key])}
                      label={label}
                      onChange={(next) => update({ [key]: next } as Partial<ExportOptions>)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={`pt-3 border-t border-border ${options.screenshots ? '' : 'opacity-45'}`}>
              <div className="text-[12px] font-semibold text-foreground mb-2">{i18n.t('guide.screenshotView')}</div>
              <OptionPills
                label={i18n.t('guide.screenshotView')}
                value={options.screenshotStyle}
                onChange={(value) => {
                  update({ screenshotStyle: value });
                  useScreenshotStyle.setState({ style: value });
                }}
                options={SCREENSHOT_STYLES.map((value) => ({ value, label: i18n.t(`guide.screenshotStyle_${value}`) }))}
              />
            </div>

            <div className={`pt-3 border-t border-border ${options.screenshots ? '' : 'opacity-45'}`}>
              <div className="text-[12px] font-semibold text-foreground mb-2">{i18n.t('exportPreview.imageScale')}</div>
              <div className="flex gap-1.5">
                {IMAGE_SCALES.map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    disabled={!options.screenshots}
                    onClick={() => update({ imageScale: scale })}
                    className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] transition-colors disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground ${
                      options.imageScale === scale
                        ? 'border-chip-on-border bg-chip-on text-chip-on-foreground'
                        : 'border-chip-border bg-chip text-muted-foreground hover:border-chip-hover-border hover:bg-chip-hover hover:text-foreground'
                    }`}
                  >
                    {i18n.t(`exportPreview.scale_${scale}`)}
                  </button>
                ))}
              </div>
            </div>

            {video.supported && (
              <div className="pt-3 border-t border-border">
                <div className="text-[12px] font-semibold text-foreground mb-2">
                  {i18n.t('exportPreview.resolution')}
                </div>
                <div className="flex gap-1.5">
                  {VIDEO_RESOLUTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update({ resolution: value })}
                      className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${
                        options.resolution === value
                          ? 'border-chip-on-border bg-chip-on text-chip-on-foreground'
                          : 'border-chip-border bg-chip text-muted-foreground hover:border-chip-hover-border hover:bg-chip-hover hover:text-foreground'
                      }`}
                    >
                      {i18n.t(`exportPreview.res_${value}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {video.supported && (
              <div className="pt-3 border-t border-border">
                <div className="text-[12px] font-semibold text-foreground mb-2">{i18n.t('exportPreview.audio')}</div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-pressed={!voiceover}
                    onClick={() => update({ voiceover: false })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] leading-none transition-colors ${
                      voiceover
                        ? 'border-chip-border bg-chip text-muted-foreground hover:border-chip-hover-border hover:bg-chip-hover hover:text-foreground'
                        : 'border-chip-on-border bg-chip-on text-chip-on-foreground'
                    }`}
                  >
                    <span className="leading-none">{i18n.t('exportPreview.audioSilent')}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={voiceover}
                    disabled={!voiceoverReady}
                    onClick={() => update({ voiceover: true })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] leading-none transition-colors disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground ${
                      voiceover
                        ? 'border-chip-on-border bg-chip-on text-chip-on-foreground'
                        : 'border-chip-border bg-chip text-muted-foreground hover:border-chip-hover-border hover:bg-chip-hover hover:text-foreground'
                    }`}
                  >
                    <span className="leading-none">{i18n.t('exportPreview.audioNarrated')}</span>
                    <Volume2 size={11} className="shrink-0 block" />
                  </button>
                </div>

                {!voiceoverReady && (
                  <div className="mt-1.5 px-0.5 text-[10px] text-muted-foreground leading-snug">
                    {i18n.t('exportPreview.voiceoverNoKey')}
                  </div>
                )}

                {voiceover && voiceoverError && (
                  <div
                    className="mt-1.5 rounded-lg px-2.5 py-2 text-[10px] leading-snug text-destructive bg-destructive/10"
                    role="alert"
                  >
                    {i18n.t(VOICEOVER_SKIP_MESSAGES[voiceoverError.reason])}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-border">
              <div className="text-[12px] font-semibold text-foreground mb-2">{i18n.t('exportPreview.gifQuality')}</div>
              <div className="flex gap-1.5">
                {GIF_QUALITIES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ gifQuality: value })}
                    className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${
                      options.gifQuality === value
                        ? 'border-chip-on-border bg-chip-on text-chip-on-foreground'
                        : 'border-chip-border bg-chip text-muted-foreground hover:border-chip-hover-border hover:bg-chip-hover hover:text-foreground'
                    }`}
                  >
                    {i18n.t(`exportPreview.gif_${value}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="text-[12px] font-semibold text-foreground">{i18n.t('exportPreview.bundle')}</div>
              <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                {i18n.t('exportPreview.bundleHint')}
              </div>

              <div className="flex items-start justify-between gap-3 mt-3">
                <div>
                  <div className="text-[12px] font-semibold text-foreground">
                    {i18n.t('exportPreview.bundleStripInputs')}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-snug">
                    {i18n.t('exportPreview.bundleStripInputsHint')}
                  </div>
                </div>
                <div className="mt-0.5 flex shrink-0">
                  <Switch
                    checked={options.bundleStripInputs}
                    label={i18n.t('exportPreview.bundleStripInputs')}
                    onChange={(next) => update({ bundleStripInputs: next })}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-[12px] font-semibold text-foreground mb-2">
                  {i18n.t('exportPreview.bundleUrls')}
                </div>
                <div className="flex gap-1.5">
                  {BUNDLE_URL_MODES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update({ bundleUrls: value })}
                      className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${
                        options.bundleUrls === value
                          ? 'border-chip-on-border bg-chip-on text-chip-on-foreground'
                          : 'border-chip-border bg-chip text-muted-foreground hover:border-chip-hover-border hover:bg-chip-hover hover:text-foreground'
                      }`}
                    >
                      {i18n.t(`exportPreview.url_${value}`)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-snug mt-3">
                {i18n.t('exportPreview.bundleRedactionNote')}
              </p>

              {typedStepCount > 0 && (
                <p className="flex items-start gap-1.5 text-[10px] leading-snug mt-2 text-foreground">
                  <TriangleAlert size={12} className="shrink-0 mt-px text-accent" />
                  <span>
                    {typedStepCount === 1
                      ? i18n.t('exportPreview.bundleTypedWarning', [String(typedStepCount)])
                      : i18n.t('exportPreview.bundleTypedWarningPlural', [String(typedStepCount)])}
                  </span>
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-border space-y-1.5">
              {formats.map(({ key, icon: Icon, label }) => (
                <FormatRow key={key} format={key} label={label} icon={<Icon size={14} />} doc={doc} />
              ))}
              <ShareResult url={doc.shareUrl} error={doc.shareError} />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {video.supported && (
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-border">
                {modes.map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={mode === key}
                    onClick={() => setMode(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
                      mode === key
                        ? 'border-chip-on-border bg-tab-on text-chip-on-foreground'
                        : 'border-chip-border bg-chip text-muted-foreground hover:border-chip-hover-border hover:bg-chip-hover hover:text-foreground'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className={`flex-1 relative overflow-hidden ${mode === 'document' ? 'bg-[#3F3F46]' : 'bg-secondary'}`}>
              {mode === 'document' ? (
                <>
                  {doc.rendering && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-card border border-border rounded-full px-2.5 py-1">
                      <Loader2 size={11} className="animate-spin" />
                      {i18n.t('exportPreview.rendering')}
                    </div>
                  )}
                  <iframe
                    title={i18n.t('exportPreview.title')}
                    srcDoc={doc.html}
                    onLoad={(event) => {
                      const doc = event.currentTarget.contentDocument;
                      if (doc) paginatePreview(doc);
                    }}
                    className="w-full h-full border-0"
                  />
                </>
              ) : (
                <VideoPreviewPane video={video} stepCount={steps.length} voiceover={voiceover} />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
