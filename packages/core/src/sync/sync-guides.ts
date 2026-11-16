import { exportGuideAsHTML } from '@/core/export/html-export';
import { DEFAULT_EXPORT_OPTIONS } from '@/core/export/options';
import { getAllGuidesForSync, getGuide, replaceGuideContents } from '@/core/guides/service';
import { exportGuideAsBundle } from '@/core/transfer/bundle';
import { localGuideHash } from './local-hash';
import { isSampleGuide } from './sample-guides';
import { applySnapshot, buildSnapshot } from './snapshot';

interface SyncMark {
  localHash: string;
  remoteHash: string;
  updatedAt: number;
}

export type SyncState = Record<string, SyncMark>;

export interface SyncTransport {
  request(path: string, init?: RequestInit): Promise<Response>;
  loadState(): Promise<SyncState>;
  saveState(state: SyncState): Promise<void>;
}

interface RemoteGuide {
  clientId: string;
  hash: string | null;
  deleted: boolean;
  hasSnapshot: boolean;
  updatedAt: number | null;
}

async function push(
  transport: SyncTransport,
  guideId: string,
  hash: string,
  baseHash: string | null,
): Promise<boolean> {
  const data = await getGuide(guideId);
  const snapshot = await buildSnapshot(guideId);
  if (!data || !snapshot) return false;
  const { guide, steps, screenshots } = data;
  const form = new FormData();
  form.set(
    'meta',
    JSON.stringify({
      title: guide.title,
      description: guide.description ?? '',
      stepCount: steps.length,
      createdAt: guide.createdAt,
      updatedAt: guide.updatedAt,
      deleted: guide.deletedAt != null,
      hash,
      baseHash,
    }),
  );
  form.set('snapshot', snapshot, 'guide.snap');
  if (guide.deletedAt == null) {
    form.set(
      'html',
      new Blob([await exportGuideAsHTML(guide, steps, screenshots, DEFAULT_EXPORT_OPTIONS)], { type: 'text/html' }),
      'guide.html',
    );
    form.set(
      'bundle',
      await exportGuideAsBundle(guide, steps, screenshots, { stripInputValues: false, urls: 'full' }),
      'guide.flownote',
    );
  }
  const response = await transport.request(`/api/guides/${encodeURIComponent(guideId)}`, { method: 'PUT', body: form });
  return response.ok;
}

async function pull(transport: SyncTransport, guideId: string): Promise<boolean> {
  const response = await transport.request(`/api/sync/guides/${encodeURIComponent(guideId)}/snapshot`);
  if (!response.ok) return false;
  await applySnapshot(await response.blob());
  return true;
}

async function bumpIfUnstamped(guideId: string, previous: number | undefined): Promise<void> {
  const data = await getGuide(guideId);
  if (!data) return;
  if (previous === undefined || data.guide.updatedAt > previous) return;
  await replaceGuideContents({ ...data.guide, updatedAt: Date.now() }, data.steps, [...data.screenshots.values()]);
}

let running = false;

export async function syncGuides(transport: SyncTransport): Promise<void> {
  if (running) return;
  running = true;
  try {
    const listing = await transport.request('/api/sync/guides');
    if (!listing.ok) return;
    const remote = new Map(((await listing.json()) as { guides: RemoteGuide[] }).guides.map((g) => [g.clientId, g]));
    const state = await transport.loadState();
    const local = new Map((await getAllGuidesForSync()).filter((g) => !isSampleGuide(g.id)).map((g) => [g.id, g]));

    const removed = new Set<string>();
    for (const id of Object.keys(state)) {
      if (local.has(id)) continue;
      removed.add(id);
      const known = remote.get(id);
      if (known && !known.deleted)
        await transport.request(`/api/guides/${encodeURIComponent(id)}`, { method: 'DELETE' });
      delete state[id];
    }

    for (const id of new Set([...local.keys(), ...remote.keys()])) {
      if (removed.has(id)) continue;
      const mark = state[id];
      const theirs = remote.get(id);
      const mine = local.get(id);

      if (!mine) {
        if (!theirs || theirs.deleted || !theirs.hasSnapshot || mark) continue;
        if (await pull(transport, id)) {
          const hash = await localGuideHash(id);
          if (hash) state[id] = { localHash: hash, remoteHash: theirs.hash ?? '', updatedAt: theirs.updatedAt ?? 0 };
        }
        continue;
      }

      const hash = await localGuideHash(id);
      if (!hash) continue;
      const localChanged = !mark || hash !== mark.localHash;
      const remoteChanged = !!theirs && (!mark || (theirs.hash ?? '') !== mark.remoteHash);

      if (theirs && !mark && theirs.hash === hash) {
        state[id] = { localHash: hash, remoteHash: hash, updatedAt: mine.updatedAt };
        continue;
      }
      if (!localChanged && !remoteChanged) continue;

      const remoteWins =
        remoteChanged && theirs?.hasSnapshot === true && (!localChanged || (theirs.updatedAt ?? 0) >= mine.updatedAt);

      if (remoteWins) {
        if (await pull(transport, id)) {
          const next = await localGuideHash(id);
          if (next) state[id] = { localHash: next, remoteHash: theirs?.hash ?? '', updatedAt: theirs?.updatedAt ?? 0 };
        }
        continue;
      }

      if (localChanged) {
        await bumpIfUnstamped(id, mark?.updatedAt);
        const stamped = await localGuideHash(id);
        const current = await getGuide(id);
        if (!stamped || !current) continue;
        if (await push(transport, id, stamped, theirs?.hash ?? null)) {
          state[id] = { localHash: stamped, remoteHash: stamped, updatedAt: current.guide.updatedAt };
        }
      }
    }
    await transport.saveState(state);
  } catch {
    return;
  } finally {
    running = false;
  }
}
