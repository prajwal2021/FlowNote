import type { Screenshot } from '@/core/guides/types';
import { renderScreenshot } from './render';

export type ScreenshotStyle = 'zoomed' | 'full' | 'both';

export const SCREENSHOT_STYLES: ScreenshotStyle[] = ['full', 'zoomed', 'both'];

const GAP_RATIO = 0.02;
const BACKGROUND = '#ffffff';
const ENCODE = { format: 'image/webp', quality: 0.92 } as const;

const cache = new WeakMap<Screenshot, Map<string, { edits: unknown; image: Promise<Screenshot> }>>();

function synthetic(shot: Screenshot, blob: Blob, width: number, height: number): Screenshot {
  return {
    id: shot.id,
    stepId: shot.stepId,
    blob,
    mimeType: blob.type || 'image/webp',
    width,
    height,
    pixelRatio: 1,
    edits: shot.edits?.alt ? { alt: shot.edits.alt } : undefined,
  };
}

async function stack(top: Blob, bottom: Blob, shot: Screenshot): Promise<Screenshot> {
  const [first, second] = await Promise.all([createImageBitmap(top), createImageBitmap(bottom)]);
  const width = first.width;
  const lower = Math.round(second.height * (width / second.width));
  const gap = Math.round(width * GAP_RATIO);
  const canvas = new OffscreenCanvas(width, first.height + gap + lower);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(first, 0, 0);
  ctx.drawImage(second, 0, first.height + gap, width, lower);
  first.close();
  second.close();
  return synthetic(shot, await canvas.convertToBlob(ENCODE), canvas.width, canvas.height);
}

async function build(shot: Screenshot, style: ScreenshotStyle): Promise<Screenshot> {
  const wholeFrame = { x: 0, y: 0, width: shot.width, height: shot.height };
  const full = await renderScreenshot(shot, { ...ENCODE, viewport: wholeFrame });
  if (style === 'full') return synthetic(shot, full, shot.width, shot.height);
  return stack(full, await renderScreenshot(shot, ENCODE), shot);
}

function styled(shot: Screenshot, style: ScreenshotStyle): Promise<Screenshot> {
  let byStyle = cache.get(shot);
  if (!byStyle) {
    byStyle = new Map();
    cache.set(shot, byStyle);
  }
  const hit = byStyle.get(style);
  if (hit && hit.edits === shot.edits) return hit.image;
  const image = build(shot, style);
  image.catch(() => byStyle.delete(style));
  byStyle.set(style, { edits: shot.edits, image });
  return image;
}

export async function applyScreenshotStyle(
  screenshots: Map<string, Screenshot>,
  style: ScreenshotStyle,
): Promise<Map<string, Screenshot>> {
  if (style === 'zoomed') return screenshots;
  try {
    const entries = await Promise.all(
      [...screenshots].map(async ([stepId, shot]) => [stepId, await styled(shot, style)] as const),
    );
    return new Map(entries);
  } catch {
    return screenshots;
  }
}
