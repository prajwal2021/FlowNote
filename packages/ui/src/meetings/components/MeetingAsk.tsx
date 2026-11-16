import { i18n } from '@flownote/core/env';
import { askMeeting } from '@flownote/core/meetings/ask-meeting';
import { readMeetingAi } from '@flownote/core/meetings/read-meeting-ai';
import { timestampLabel } from '@flownote/core/meetings/timestamp-label';
import type { MeetingAnswer, MeetingSegment } from '@flownote/core/meetings/types';
import { Loader2, SendHorizontal } from 'lucide-react';
import { useState } from 'react';

interface MeetingAskProps {
  segments: MeetingSegment[];
  onSeek: (atSec: number) => void;
}

export function MeetingAsk({ segments, onSeek }: MeetingAskProps) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<MeetingAnswer[]>([]);
  const [failed, setFailed] = useState(false);

  const ask = async () => {
    const asked = question.trim();
    if (!asked || asking) return;
    setAsking(true);
    setFailed(false);
    const config = await readMeetingAi();
    const answer = config ? await askMeeting(asked, segments, config) : null;
    if (answer) {
      setHistory((previous) => [...previous, answer]);
      setQuestion('');
    } else {
      setFailed(true);
    }
    setAsking(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {i18n.t('meetings.askTitle')}
      </h2>

      {history.map((entry) => (
        <div key={entry.askedAt} className="flex flex-col gap-1.5">
          <p className="text-[13px] font-semibold text-foreground">{entry.question}</p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{entry.answer}</p>
          {entry.citations.length > 0 && (
            <p className="flex flex-wrap gap-1.5">
              {entry.citations.map((atSec) => (
                <button
                  key={atSec}
                  onClick={() => onSeek(atSec)}
                  className="px-1.5 py-0.5 rounded text-[11px] tabular-nums bg-secondary text-muted-foreground hover:text-foreground"
                >
                  {timestampLabel(atSec)}
                </button>
              ))}
            </p>
          )}
        </div>
      ))}

      {failed && <p className="text-[12px] text-primary-text">{i18n.t('meetings.askFailed')}</p>}

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void ask()}
          placeholder={i18n.t('meetings.askPlaceholder')}
          className="flex-1 h-9 px-3 rounded-lg bg-card text-[13px] text-foreground ring-1 ring-border outline-none focus:ring-primary/40"
        />
        <button
          onClick={() => void ask()}
          disabled={asking || question.trim() === ''}
          aria-label={i18n.t('meetings.askSend')}
          className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          {asking ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
        </button>
      </div>
    </div>
  );
}
