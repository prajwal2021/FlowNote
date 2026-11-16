import { describe, expect, it } from 'vitest';
import { formatTranscript } from '../format-transcript';
import { timestampLabel } from '../timestamp-label';
import type { MeetingSegment } from '../types';

const segment = (over: Partial<MeetingSegment>): MeetingSegment => ({
  id: 'a',
  meetingId: 'm',
  speaker: 'me',
  start: 0,
  end: 1,
  text: 'hello',
  ...over,
});

describe('timestampLabel', () => {
  it('writes minutes and seconds under an hour', () => {
    expect(timestampLabel(0)).toBe('0:00');
    expect(timestampLabel(65)).toBe('1:05');
  });

  it('writes hours once past one', () => {
    expect(timestampLabel(3725)).toBe('1:02:05');
  });

  it('floors to a whole second and never goes negative', () => {
    expect(timestampLabel(9.9)).toBe('0:09');
    expect(timestampLabel(-4)).toBe('0:00');
  });
});

describe('formatTranscript', () => {
  it('stamps each line and names the speaker', () => {
    const text = formatTranscript(
      [segment({ start: 0, text: 'morning' }), segment({ id: 'b', speaker: 'others', start: 61, text: 'morning' })],
      'You',
      'Others',
    );
    expect(text).toBe('[0:00] You: morning\n[1:01] Others: morning');
  });

  it('returns an empty string with no segments', () => {
    expect(formatTranscript([], 'You', 'Others')).toBe('');
  });
});
