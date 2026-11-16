import { describe, expect, it } from 'vitest';
import type { Screenshot } from '@/core/guides/types';
import { applyScreenshotStyle } from '../screenshot-style';

const shot: Screenshot = {
  id: 's1',
  stepId: 'a',
  blob: new Blob(['x'], { type: 'image/png' }),
  mimeType: 'image/png',
  width: 100,
  height: 50,
};

describe('applyScreenshotStyle', () => {
  it('leaves the zoomed screenshots exactly as they are', async () => {
    const map = new Map([['a', shot]]);
    expect(await applyScreenshotStyle(map, 'zoomed')).toBe(map);
  });

  it('falls back to the zoomed screenshots when the browser cannot draw the full frame', async () => {
    const map = new Map([['a', shot]]);
    expect(await applyScreenshotStyle(map, 'both')).toBe(map);
  });
});
