import { describe, expect, it } from 'vitest';
import { mergeTracks, type Track } from '../merge-tracks';

function ids() {
  let n = 0;
  return () => {
    n += 1;
    return `s${n}`;
  };
}

describe('mergeTracks', () => {
  it('orders both tracks by time and labels the speaker', () => {
    const tracks: Track[] = [
      { speaker: 'me', offsetSec: 0, lines: [{ start: 0, end: 2, text: 'hello everyone' }] },
      { speaker: 'others', offsetSec: 0, lines: [{ start: 3, end: 5, text: 'hi there' }] },
    ];
    const merged = mergeTracks('m1', tracks, ids());
    expect(merged.map((s) => [s.speaker, s.text])).toEqual([
      ['me', 'hello everyone'],
      ['others', 'hi there'],
    ]);
    expect(merged.every((s) => s.meetingId === 'm1')).toBe(true);
  });

  it('applies the per-track offset so tracks share one clock', () => {
    const tracks: Track[] = [
      { speaker: 'me', offsetSec: 10, lines: [{ start: 0, end: 1, text: 'later' }] },
      { speaker: 'others', offsetSec: 0, lines: [{ start: 2, end: 3, text: 'earlier' }] },
    ];
    expect(mergeTracks('m1', tracks, ids()).map((s) => s.text)).toEqual(['earlier', 'later']);
  });

  it('joins consecutive lines from one speaker across a short gap', () => {
    const tracks: Track[] = [
      {
        speaker: 'others',
        offsetSec: 0,
        lines: [
          { start: 0, end: 2, text: 'so the plan' },
          { start: 2.5, end: 4, text: 'is to ship on friday' },
        ],
      },
    ];
    const merged = mergeTracks('m1', tracks, ids());
    expect(merged).toHaveLength(1);
    expect(merged[0]!.text).toBe('so the plan is to ship on friday');
    expect(merged[0]!.end).toBe(4);
  });

  it('keeps a long pause as a separate segment', () => {
    const tracks: Track[] = [
      {
        speaker: 'others',
        offsetSec: 0,
        lines: [
          { start: 0, end: 2, text: 'first' },
          { start: 20, end: 21, text: 'second' },
        ],
      },
    ];
    expect(mergeTracks('m1', tracks, ids())).toHaveLength(2);
  });

  it('never joins across speakers', () => {
    const tracks: Track[] = [
      { speaker: 'me', offsetSec: 0, lines: [{ start: 0, end: 2, text: 'question' }] },
      { speaker: 'others', offsetSec: 0, lines: [{ start: 2.1, end: 3, text: 'answer' }] },
    ];
    expect(mergeTracks('m1', tracks, ids())).toHaveLength(2);
  });

  it('drops empty and zero-length lines', () => {
    const tracks: Track[] = [
      {
        speaker: 'me',
        offsetSec: 0,
        lines: [
          { start: 0, end: 1, text: '   ' },
          { start: 1, end: 1, text: 'zero length' },
          { start: 2, end: 3, text: 'kept' },
        ],
      },
    ];
    expect(mergeTracks('m1', tracks, ids()).map((s) => s.text)).toEqual(['kept']);
  });

  it('clamps a line that straddles the start of the meeting', () => {
    const tracks: Track[] = [{ speaker: 'me', offsetSec: -5, lines: [{ start: 3, end: 8, text: 'straddles' }] }];
    const merged = mergeTracks('m1', tracks, ids());
    expect(merged).toHaveLength(1);
    expect(merged[0]!.start).toBe(0);
    expect(merged[0]!.end).toBe(3);
  });

  it('drops a line that falls entirely before the meeting started', () => {
    const tracks: Track[] = [{ speaker: 'me', offsetSec: -5, lines: [{ start: 1, end: 2, text: 'before' }] }];
    expect(mergeTracks('m1', tracks, ids())).toEqual([]);
  });
});
