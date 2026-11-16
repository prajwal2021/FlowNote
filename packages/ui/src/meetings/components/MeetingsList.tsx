import { i18n } from '@flownote/core/env';
import { navigate } from '../../navigation/lib/navigate';
import { useMeetings } from '../hooks/use-meetings';
import { MeetingRow } from './MeetingRow';

interface MeetingsListProps {
  onStart: () => void;
}

export function MeetingsList({ onStart }: MeetingsListProps) {
  const { meetings, loading } = useMeetings();

  return (
    <main className="flex-1 flex flex-col py-8 px-6 gap-5">
      <header className="flex items-center gap-3">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">{i18n.t('meetings.title')}</h1>
        <button
          onClick={onStart}
          className="ml-auto h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold shadow-md shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          {i18n.t('meetings.record')}
        </button>
      </header>

      {loading ? null : meetings.length === 0 ? (
        <p className="text-[13px] text-muted-foreground max-w-prose">{i18n.t('meetings.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {meetings.map((meeting) => (
            <MeetingRow
              key={meeting.id}
              meeting={meeting}
              onOpen={(meetingId) => navigate({ page: 'meeting', meetingId })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
