import { API_KEY_SETTINGS, readApiKeys, withKey } from '@/core/capture/ai/keys';
import { localStorage } from '@/core/env';

export interface AiKeyMark {
  value: string;
  at: number;
}

export interface AiKeyTransport {
  request(path: string, init?: RequestInit): Promise<Response>;
  loadMark(): Promise<AiKeyMark | null>;
  saveMark(mark: AiKeyMark): Promise<void>;
}

async function pushKey(transport: AiKeyTransport, value: string): Promise<number | null> {
  const response = await transport.request('/api/me/ai-key', {
    method: value ? 'PUT' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: value ? JSON.stringify({ key: value }) : undefined,
  });
  if (!response.ok) return null;
  return ((await response.json()) as { updatedAt: number | null }).updatedAt ?? 0;
}

export async function syncAiKey(transport: AiKeyTransport): Promise<void> {
  const response = await transport.request('/api/me/ai-key');
  if (!response.ok) return;
  const remote = (await response.json()) as { key: string | null; updatedAt: number | null };
  const remoteKey = remote.key ?? '';
  const remoteAt = remote.updatedAt ?? 0;

  const stored = await localStorage.get([...API_KEY_SETTINGS]);
  const keys = readApiKeys(stored);
  const local = keys.openai ?? '';
  const mark = await transport.loadMark();

  const localChanged = mark ? local !== mark.value : local !== '' && remoteKey === '';
  const remoteChanged = mark ? remoteAt > mark.at : remoteKey !== local;

  if (localChanged) {
    const at = await pushKey(transport, local);
    if (at !== null) await transport.saveMark({ value: local, at });
    return;
  }
  if (remoteChanged) {
    await localStorage.set({ apiKeys: withKey(keys, 'openai', remoteKey) });
    await transport.saveMark({ value: remoteKey, at: remoteAt });
    return;
  }
  if (!mark) await transport.saveMark({ value: local, at: remoteAt });
}
