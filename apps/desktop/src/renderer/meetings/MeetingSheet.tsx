import { i18n } from '@flownote/core/env';
import { logger } from '@flownote/core/logger';
import { AlertTriangle, Loader2, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MeetingSourceOption } from '../../main/meetings/meeting-sources';
import type { SystemAudioSupport } from '../../main/meetings/system-audio';
import { MeetingSession } from './meeting-session';

interface MeetingSheetProps {
  onClose: () => void;
  onRecorded: (meetingId: string) => void;
}

export function MeetingSheet({ onClose, onRecorded }: MeetingSheetProps) {
  const [sources, setSources] = useState<MeetingSourceOption[] | null>(null);
  const [chosen, setChosen] = useState<MeetingSourceOption | null>(null);
  const [support, setSupport] = useState<SystemAudioSupport | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useRef<MeetingSession | null>(null);

  useEffect(() => {
    void window.flownote.meetings.systemAudio().then((found) => {
      setSupport(found);
      if (found !== 'system-picker') void window.flownote.meetings.sources().then(setSources);
    });
  }, []);

  const systemPicker = support === 'system-picker';

  const start = async () => {
    if (!systemPicker && !chosen) return;
    const active = new MeetingSession({
      onLevel: () => undefined,
      onEnded: (meetingId) => {
        setRecording(false);
        onRecorded(meetingId);
      },
      onProgress: () => undefined,
    });
    try {
      await active.start(chosen?.id ?? null, chosen?.name ?? '');
      active.notified();
      session.current = active;
      setRecording(true);
    } catch (err) {
      logger.error('meetings: recording could not start', err);
      setError(i18n.t('meetings.failed'));
    }
  };

  if (recording) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="flex flex-col gap-4 w-[380px] p-6 rounded-2xl bg-card ring-1 ring-border shadow-xl">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <span className="size-2.5 rounded-full bg-primary animate-pulse" />
            {i18n.t('meetings.recording')}
          </p>
          <button
            onClick={() => void session.current?.stop()}
            className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold"
          >
            <Square size={14} />
            {i18n.t('meetings.stopRecording')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col gap-4 w-[640px] max-h-[80vh] p-6 rounded-2xl bg-card ring-1 ring-border shadow-xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-bold tracking-tight text-foreground">{i18n.t('meetings.pickSource')}</h2>
          <p className="text-[12px] text-muted-foreground">{i18n.t('meetings.pickSourceHint')}</p>
        </div>

        <div className="flex flex-col gap-2 p-3 rounded-xl bg-primary/5 ring-1 ring-primary/20">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary-text">
            <AlertTriangle size={13} />
            {i18n.t('meetings.consentTitle')}
          </p>
          <p className="text-[12px] text-muted-foreground">{i18n.t('meetings.consentBody')}</p>
        </div>

        {support === 'unsupported' && (
          <p className="text-[12px] text-primary-text">{i18n.t('meetings.systemAudioUnsupported')}</p>
        )}
        {systemPicker && <p className="text-[12px] text-muted-foreground">{i18n.t('meetings.systemPickerHint')}</p>}
        {error && <p className="text-[12px] text-primary-text">{error}</p>}

        <div className={systemPicker ? 'hidden' : 'grid grid-cols-3 gap-2 overflow-y-auto'}>
          {sources === null ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            sources.map((source) => (
              <button
                key={source.id}
                onClick={() => setChosen(source)}
                className={`flex flex-col gap-1 p-1.5 rounded-lg text-left ring-1 transition-all ${chosen?.id === source.id ? 'ring-2 ring-primary' : 'ring-border hover:ring-primary/40'}`}
              >
                {source.thumbnail && (
                  <img src={source.thumbnail} alt="" className="block w-full rounded object-cover" />
                )}
                <span className="text-[11px] text-foreground truncate">{source.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="h-9 px-3.5 rounded-xl text-[13px] font-medium text-muted-foreground">
            {i18n.t('meetings.cancel')}
          </button>
          <button
            onClick={() => void start()}
            disabled={!systemPicker && !chosen}
            className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-40"
          >
            {i18n.t('meetings.consentConfirm')} — {i18n.t('meetings.startRecording')}
          </button>
        </div>
      </div>
    </div>
  );
}
