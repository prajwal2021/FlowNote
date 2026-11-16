import { beforeEach, describe, expect, it } from 'vitest';
import { localStorage } from '../../env';
import { type AiKeyMark, type AiKeyTransport, syncAiKey } from '../sync-ai-key';

function fakeServer(initial: { key: string | null; updatedAt: number | null } = { key: null, updatedAt: null }) {
  const server = { ...initial };
  let mark: AiKeyMark | null = null;
  const transport: AiKeyTransport = {
    loadMark: async () => mark,
    saveMark: async (next) => {
      mark = next;
    },
    request: async (_path, init) => {
      if (init?.method === 'PUT') {
        server.key = JSON.parse(String(init.body)).key;
        server.updatedAt = (server.updatedAt ?? 0) + 10;
      } else if (init?.method === 'DELETE') {
        server.key = null;
        server.updatedAt = (server.updatedAt ?? 0) + 10;
      }
      return Response.json(server);
    },
  };
  return { server, transport };
}

const localKey = async () => (await localStorage.get(['apiKeys'])).apiKeys?.openai ?? '';

beforeEach(async () => {
  await localStorage.set({ apiKeys: {} });
});

describe('syncAiKey', () => {
  it('uploads a key entered on this device', async () => {
    const { server, transport } = fakeServer();
    await localStorage.set({ apiKeys: { openai: 'sk-local' } });
    await syncAiKey(transport);
    expect(server.key).toBe('sk-local');
  });

  it('fills a new device from the key saved on the account', async () => {
    const { transport } = fakeServer({ key: 'sk-account', updatedAt: 5 });
    await syncAiKey(transport);
    expect(await localKey()).toBe('sk-account');
  });

  it('carries a later change in both directions', async () => {
    const { server, transport } = fakeServer();
    await localStorage.set({ apiKeys: { openai: 'sk-one' } });
    await syncAiKey(transport);

    await localStorage.set({ apiKeys: { openai: 'sk-two' } });
    await syncAiKey(transport);
    expect(server.key).toBe('sk-two');

    server.key = 'sk-from-web';
    server.updatedAt = (server.updatedAt ?? 0) + 100;
    await syncAiKey(transport);
    expect(await localKey()).toBe('sk-from-web');
  });

  it('removes the key everywhere when it is cleared on one device', async () => {
    const { server, transport } = fakeServer();
    await localStorage.set({ apiKeys: { openai: 'sk-one' } });
    await syncAiKey(transport);
    await localStorage.set({ apiKeys: {} });
    await syncAiKey(transport);
    expect(server.key).toBeNull();
  });
});
