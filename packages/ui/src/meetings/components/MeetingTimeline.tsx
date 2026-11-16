import { i18n } from '@flownote/core/env';
import { timestampLabel } from '@flownote/core/meetings/timestamp-label';
import type { MeetingFrame } from '@flownote/core/meetings/types';
import { useEffect, useState } from 'react';

interface MeetingTimelineProps {
  frames: MeetingFrame[];
  activeSec: number | null;
  onSeek: (atSec: number) => void;
}

export function MeetingTimeline({ frames, activeSec, onSeek }: MeetingTimelineProps) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const made = frames.map((frame) => URL.createObjectURL(frame.blob));
    setUrls(made);
    return () => {
      for (const url of made) URL.revokeObjectURL(url);
    };
  }, [frames]);

  if (frames.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {i18n.t('meetings.screenTimeline')}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {frames.map((frame, index) => {
          const next = frames[index + 1];
          const active = activeSec !== null && activeSec >= frame.atSec && (!next || activeSec < next.atSec);
          return (
            <button
              key={frame.id}
              onClick={() => onSeek(frame.atSec)}
              title={timestampLabel(frame.atSec)}
              className={`shrink-0 rounded-lg overflow-hidden ring-1 transition-all ${active ? 'ring-2 ring-primary' : 'ring-border hover:ring-primary/40'}`}
            >
              <img src={urls[index]} alt="" width={160} className="block h-[100px] w-[160px] object-cover" />
              <span className="block px-2 py-1 text-[10px] font-medium tabular-nums text-muted-foreground bg-card">
                {timestampLabel(frame.atSec)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
