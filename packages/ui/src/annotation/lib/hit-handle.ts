import type { ScreenshotBounds } from '@flownote/core/guides/types';
import type { Handle } from '@flownote/core/screenshot/geometry';
import { handleCorners } from './handle-corners';

export function hitHandle(b: ScreenshotBounds, x: number, y: number, radius: number): Handle | null {
  for (const [handle, hx, hy] of handleCorners(b)) {
    if (Math.abs(x - hx) <= radius && Math.abs(y - hy) <= radius) return handle;
  }
  return null;
}
