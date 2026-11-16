import { i18n } from '@flownote/core/env';
import { timestampLabel } from '@flownote/core/meetings/timestamp-label';
import type { Meeting } from '@flownote/core/meetings/types';
import { AlertTriangle, AudioLines, Loader2, MicOff } from 'lucide-react';
import { formatRelativeTime } from '../../common/lib/format-relative-time';
import { meetingDuration } from '../lib/meeting-duration';

interface MeetingRowProps {
  meeting: Meeting;
  onOpen: (meetingId: string) => void;
}

export function MeetingRow({ meeting, onOpen }: MeetingRowProps) {
  const duration = meetingDuration(meeting.startedAt, meeting.endedAt);

  return (
    <button
      onClick={() => onOpen(meeting.id)}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left bg-card ring-1 ring-border transition-colors hover:bg-secondary/60"
    >
      <span className="flex items-center justify-center size-9 shrink-0 rounded-lg bg-primary/10 text-primary-text">
        {meeting.status === 'transcribing' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : meeting.status === 'failed' ? (
          <AlertTriangle size={16} />
        ) : (
          <AudioLines size={16} />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold text-foreground truncate">{meeting.title}</span>
        <span className="block text-[11px] text-muted-foreground truncate">
          {formatRelativeTime(meeting.startedAt)}
          {duration > 0 && ` · ${timestampLabel(duration)}`}
          {meeting.source.app?.name && ` · ${meeting.source.app.name}`}
        </span>
      </span>
      {meeting.micOnly && (
        <span title={i18n.t('meetings.micOnlyShort')} className="text-muted-foreground">
          <MicOff size={14} />
        </span>
      )}
    </button>
  );
}
