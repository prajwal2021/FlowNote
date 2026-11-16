import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  globalThis.BroadcastChannel = class {
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
  } as unknown as typeof BroadcastChannel;
});

vi.mock('@/core/export/html-export', () => ({ exportGuideAsHTML: async () => '<html></html>' }));
vi.mock('@/core/transfer/bundle', () => ({ exportGuideAsBundle: async () => new Blob(['bundle']) }));

import { db } from '../../guides/db';
import { createGuide, createStep, getGuide, saveScreenshot, updateStepDescription } from '../../guides/service';
import { localGuideHash } from '../local-hash';
import { applySnapshot, buildSnapshot } from '../snapshot';
import { type SyncState, type SyncTransport, syncGuides } from '../sync-guides';

interface Remote {
  hash: string;
  deleted: boolean;
  snapshot: Blob;
  updatedAt: number;
}

function fakeServer() {
  const remote = new Map<string, Remote>();
  let state: SyncState = {};
  const transport: SyncTransport = {
    loadState: async () => state,
    saveState: async (next) => {
      state = next;
    },
    request: async (path, init) => {
      if (path === '/api/sync/guides') {
        const guides = [...remote].map(([clientId, r]) => ({
          clientId,
          hash: r.hash,
          deleted: r.deleted,
          hasSnapshot: true,
          updatedAt: r.updatedAt,
        }));
        return Response.json({ guides });
      }
      const snapshot = path.match(/^\/api\/sync\/guides\/([^/]+)\/snapshot$/);
      if (snapshot) return new Response(remote.get(decodeURIComponent(snapshot[1]!))!.snapshot);
      const put = path.match(/^\/api\/guides\/([^/]+)$/);
      if (put && init?.method === 'PUT') {
        const form = init.body as FormData;
        const meta = JSON.parse(String(form.get('meta')));
        remote.set(decodeURIComponent(put[1]!), {
          hash: meta.hash,
          deleted: meta.deleted,
          snapshot: form.get('snapshot') as Blob,
          updatedAt: meta.updatedAt,
        });
        return Response.json({ id: 'x' });
      }
      if (put && init?.method === 'DELETE') {
        remote.get(decodeURIComponent(put[1]!))!.deleted = true;
        return Response.json({ ok: true });
      }
      return new Response('nope', { status: 404 });
    },
  };
  return { remote, transport, getState: () => state };
}

async function seedGuide(): Promise<string> {
  const guide = await createGuide('guide-aaaaaaaa');
  await createStep({
    id: 'step-1',
    guideId: guide.id,
    index: 0,
    description: 'Click Save',
    action: 'click',
    url: 'https://a.test/x',
    timestamp: 1,
    screenshotId: 'shot-1',
  });
  await saveScreenshot({
    id: 'shot-1',
    stepId: 'step-1',
    blob: new Blob(['pixels'], { type: 'image/png' }),
    mimeType: 'image/png',
    width: 10,
    height: 5,
    edits: { shapes: [] } as never,
  });
  return guide.id;
}

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('snapshots', () => {
  it('round-trips a guide with ids, screenshot bytes and edits intact', async () => {
    const id = await seedGuide();
    const before = await localGuideHash(id);
    const blob = await buildSnapshot(id);
    await db.delete();
    await db.open();
    expect(await getGuide(id)).toBeNull();
    await applySnapshot(blob!);
    const restored = await getGuide(id);
    expect(restored?.steps[0]?.id).toBe('step-1');
    expect(restored?.screenshots.get('step-1')?.id).toBe('shot-1');
    expect(await restored?.screenshots.get('step-1')?.blob.text()).toBe('pixels');
    expect(await localGuideHash(id)).toBe(before);
  });

  it('changes the hash when a step is edited', async () => {
    const id = await seedGuide();
    const before = await localGuideHash(id);
    await updateStepDescription('step-1', 'Click Save changes');
    expect(await localGuideHash(id)).not.toBe(before);
  });
});

describe('syncGuides', () => {
  it('pushes a new guide, restores it on an empty device, and pushes later edits', async () => {
    const server = fakeServer();
    const id = await seedGuide();
    await syncGuides(server.transport);
    expect(server.remote.has(id)).toBe(true);
    const pushed = server.remote.get(id)!.hash;

    await syncGuides(server.transport);
    expect(server.remote.get(id)!.hash).toBe(pushed);

    await db.delete();
    await db.open();
    const fresh = fakeServer();
    fresh.remote.set(id, server.remote.get(id)!);
    await syncGuides(fresh.transport);
    expect((await getGuide(id))?.steps[0]?.description).toBe('Click Save');

    await updateStepDescription('step-1', 'Click Save changes');
    await syncGuides(fresh.transport);
    expect(fresh.remote.get(id)!.hash).not.toBe(pushed);
  });

  it('tells the server when a guide is permanently deleted locally', async () => {
    const server = fakeServer();
    const id = await seedGuide();
    await syncGuides(server.transport);
    await db.guides.delete(id);
    await syncGuides(server.transport);
    expect(server.remote.get(id)!.deleted).toBe(true);
    expect(server.getState()[id]).toBeUndefined();
  });
});

describe('sample guides', () => {
  it('are never sent to the server', async () => {
    const server = fakeServer();
    await createGuide('sample-getting-started-basic');
    await syncGuides(server.transport);
    expect(server.remote.size).toBe(0);
  });
});
