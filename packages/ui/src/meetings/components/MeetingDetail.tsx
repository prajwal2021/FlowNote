import { i18n } from '@flownote/core/env';
import { timestampLabel } from '@flownote/core/meetings/timestamp-label';
import { ArrowLeft, MicOff } from 'lucide-react';
import { useState } from 'react';
import { navigate } from '../../navigation/lib/navigate';
import { useMeeting } from '../hooks/use-meeting';
import { meetingDuration } from '../lib/meeting-duration';
import { MeetingAsk } from './MeetingAsk';
import { MeetingInsightsPanel } from './MeetingInsightsPanel';
import { MeetingTimeline } from './MeetingTimeline';
import { MeetingTranscript } from './MeetingTranscript';

interface MeetingDetailProps {
  meetingId: string;
}

export function MeetingDetail({ meetingId }: MeetingDetailProps) {
  const { meeting, segments, frames, insights, loading } = useMeeting(meetingId);
  const [activeSec, setActiveSec] = useState<number | null>(null);

  if (loading) return null;

  if (!meeting) {
    return (
      <main className="flex-1 flex flex-col py-8 px-6">
        <p className="text-[13px] text-muted-foreground">{i18n.t('meetings.notFound')}</p>
      </main>
    );
  }

  const duration = meetingDuration(meeting.startedAt, meeting.endedAt);

  return (
    <main className="flex-1 flex flex-col py-8 px-6 gap-6">
      <header className="flex flex-col gap-2">
        <button
          onClick={() => navigate({ page: 'meetings' })}
          className="flex items-center gap-1.5 self-start text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          {i18n.t('meetings.title')}
        </button>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">{meeting.title}</h1>
        <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
          {duration > 0 && <span className="tabular-nums">{timestampLabel(duration)}</span>}
          {meeting.source.app?.name && <span>{meeting.source.app.name}</span>}
          {meeting.micOnly && (
            <span className="flex items-center gap-1 text-primary-text">
              <MicOff size={12} />
              {i18n.t('meetings.micOnly')}
            </span>
          )}
        </p>
        {meeting.status === 'transcribing' && (
          <p className="text-[12px] text-muted-foreground">{i18n.t('meetings.transcribing')}</p>
        )}
        {meeting.status === 'failed' && <p className="text-[12px] text-primary-text">{i18n.t('meetings.failed')}</p>}
      </header>

      <MeetingTimeline frames={frames} activeSec={activeSec} onSeek={setActiveSec} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section className="flex flex-col gap-2 min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {i18n.t('meetings.transcript')}
          </h2>
          <MeetingTranscript segments={segments} activeSec={activeSec} onSeek={setActiveSec} />
        </section>

        <aside className="flex flex-col gap-6 min-w-0">
          <MeetingInsightsPanel insights={insights} onSeek={setActiveSec} />
          {segments.length > 0 && <MeetingAsk segments={segments} onSeek={setActiveSec} />}
        </aside>
      </div>
    </main>
  );
}
