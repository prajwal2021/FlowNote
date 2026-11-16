import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { getGuide, replaceGuideContents } from '@/core/guides/service';
import type { Guide, Screenshot, Step } from '@/core/guides/types';

const SNAPSHOT_VERSION = 1;
const MANIFEST = 'sync.json';

type ScreenshotMeta = Omit<Screenshot, 'blob' | 'src'> & { file: string };

interface SnapshotManifest {
  version: number;
  guide: Guide;
  steps: Step[];
  screenshots: ScreenshotMeta[];
}

function portableStep(step: Step): Step {
  const { aiPending: _aiPending, narratedDescription: _narrated, ...rest } = step;
  return rest;
}

export async function buildSnapshot(guideId: string): Promise<Blob | null> {
  const data = await getGuide(guideId);
  if (!data) return null;
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {};
  const screenshots: ScreenshotMeta[] = [];
  for (const shot of data.screenshots.values()) {
    const { blob, src: _src, ...meta } = shot;
    const file = `shots/${shot.id}`;
    files[file] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }];
    screenshots.push({ ...meta, file });
  }
  const manifest: SnapshotManifest = {
    version: SNAPSHOT_VERSION,
    guide: data.guide,
    steps: data.steps.map(portableStep),
    screenshots,
  };
  files[MANIFEST] = strToU8(JSON.stringify(manifest));
  return new Blob([zipSync(files)], { type: 'application/zip' });
}

export async function applySnapshot(blob: Blob): Promise<string> {
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const raw = files[MANIFEST];
  if (!raw) throw new Error('Not a FlowNote sync snapshot');
  const manifest = JSON.parse(strFromU8(raw)) as SnapshotManifest;
  if (manifest.version !== SNAPSHOT_VERSION) throw new Error('Unsupported snapshot version');
  const screenshots: Screenshot[] = [];
  for (const { file, ...meta } of manifest.screenshots) {
    const bytes = files[file];
    if (bytes) screenshots.push({ ...meta, blob: new Blob([bytes as BlobPart], { type: meta.mimeType }) });
  }
  const present = new Set(screenshots.map((shot) => shot.id));
  const steps = manifest.steps.map((step) =>
    step.screenshotId && !present.has(step.screenshotId) ? { ...step, screenshotId: undefined } : step,
  );
  await replaceGuideContents(manifest.guide, steps, screenshots);
  return manifest.guide.id;
}
