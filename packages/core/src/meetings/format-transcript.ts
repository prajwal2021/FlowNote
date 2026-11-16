import { timestampLabel } from './timestamp-label';
import type { MeetingSegment } from './types';

export function formatTranscript(segments: readonly MeetingSegment[], youLabel: string, othersLabel: string): string {
  return segments
    .map(
      (segment) =>
        `[${timestampLabel(segment.start)}] ${segment.speaker === 'me' ? youLabel : othersLabel}: ${segment.text}`,
    )
    .join('\n');
}
