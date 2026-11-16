import { i18n } from '@flownote/core/env';
import { timestampLabel } from '@flownote/core/meetings/timestamp-label';
import type { MeetingSegment } from '@flownote/core/meetings/types';

interface MeetingTranscriptProps {
  segments: MeetingSegment[];
  activeSec: number | null;
  onSeek: (atSec: number) => void;
}

export function MeetingTranscript({ segments, activeSec, onSeek }: MeetingTranscriptProps) {
  if (segments.length === 0) {
    return <p className="text-[13px] text-muted-foreground">{i18n.t('meetings.noTranscript')}</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {segments.map((segment) => {
        const active = activeSec !== null && activeSec >= segment.start && activeSec < segment.end;
        return (
          <button
            key={segment.id}
            onClick={() => onSeek(segment.start)}
            className={`flex gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors ${active ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-secondary/60'}`}
          >
            <span className="shrink-0 w-12 pt-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {timestampLabel(segment.start)}
            </span>
            <span className="flex-1 min-w-0">
              <span
                className={`block text-[11px] font-semibold ${segment.speaker === 'me' ? 'text-primary-text' : 'text-muted-foreground'}`}
              >
                {i18n.t(segment.speaker === 'me' ? 'meetings.speakerYou' : 'meetings.speakerOthers')}
              </span>
              <span className="block text-[13px] text-foreground">{segment.text}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
