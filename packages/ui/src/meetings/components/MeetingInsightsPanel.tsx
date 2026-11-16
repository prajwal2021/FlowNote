import { i18n } from '@flownote/core/env';
import { timestampLabel } from '@flownote/core/meetings/timestamp-label';
import type { MeetingInsights } from '@flownote/core/meetings/types';
import { CheckSquare, Gavel, Lightbulb } from 'lucide-react';

interface MeetingInsightsPanelProps {
  insights: MeetingInsights | null;
  onSeek: (atSec: number) => void;
}

export function MeetingInsightsPanel({ insights, onSeek }: MeetingInsightsPanelProps) {
  if (!insights) {
    return <p className="text-[13px] text-muted-foreground">{i18n.t('meetings.noInsights')}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {i18n.t('meetings.summary')}
        </h2>
        <p className="text-[13px] leading-relaxed text-foreground">{insights.summary}</p>
      </section>

      {insights.takeaways.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Lightbulb size={13} />
            {i18n.t('meetings.takeaways')}
          </h2>
          <ul className="flex flex-col gap-1.5">
            {insights.takeaways.map((line) => (
              <li key={line} className="flex gap-2 text-[13px] text-foreground">
                <span className="text-primary-text">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {insights.decisions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Gavel size={13} />
            {i18n.t('meetings.decisions')}
          </h2>
          <ul className="flex flex-col gap-1.5">
            {insights.decisions.map((line) => (
              <li key={line} className="flex gap-2 text-[13px] text-foreground">
                <span className="text-primary-text">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {insights.actionItems.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <CheckSquare size={13} />
            {i18n.t('meetings.actionItems')}
          </h2>
          <ul className="flex flex-col gap-2">
            {insights.actionItems.map((item) => (
              <li
                key={item.text}
                className={`flex flex-col gap-1 px-3 py-2 rounded-lg ring-1 ${item.mine ? 'bg-primary/5 ring-primary/20' : 'bg-card ring-border'}`}
              >
                <span className="text-[13px] text-foreground">{item.text}</span>
                <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {item.mine && <span className="font-semibold text-primary-text">{i18n.t('meetings.yours')}</span>}
                  {item.owner && <span>{item.owner}</span>}
                  {item.due && <span>{item.due}</span>}
                  {item.atSec !== null && (
                    <button onClick={() => onSeek(item.atSec ?? 0)} className="underline tabular-nums">
                      {timestampLabel(item.atSec)}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
