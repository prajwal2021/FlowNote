import { describe, expect, it } from 'vitest';
import { trackOffsetSec } from '../track-offset';

describe('trackOffsetSec', () => {
  it('is zero when the track has no epoch', () => {
    expect(trackOffsetSec(null, 1_000_000)).toBe(0);
  });

  it('is positive when audio started after the meeting', () => {
    expect(trackOffsetSec(1_002_500, 1_000_000)).toBe(2.5);
  });

  it('is negative when audio started before the meeting was recorded', () => {
    expect(trackOffsetSec(999_000, 1_000_000)).toBe(-1);
  });

  it('puts two tracks on one clock', () => {
    const started = 1_000_000;
    expect(trackOffsetSec(1_000_000, started)).toBe(0);
    expect(trackOffsetSec(1_003_000, started)).toBe(3);
  });
});
