import type { AiFailureUpdate } from '@flownote/core/capture/ai/errors';
import type { CaptureInsert } from '@flownote/core/capture/capture-insert';
import type { Rect } from '@flownote/core/rect';
import { contextBridge, ipcRenderer } from 'electron';
import type { CaptureSettings } from '../main/capture/settings';
import type { DesktopStateUpdate, RendererRequest, RendererRequests } from '../main/ipc';
import type { MeetingSourceOption } from '../main/meetings/meeting-sources';
import type { SystemAudioSupport } from '../main/meetings/system-audio';
import type { OverlayNarration } from '../main/overlay';
import type { CapturePermissions, MicrophoneAccess, PermissionKind } from '../main/permissions';

const api = {
  version: (): Promise<string> => ipcRenderer.invoke('flownote:version'),
  capture: {
    region: (): Promise<Rect> => ipcRenderer.invoke('flownote:capture:region'),
    edit: (insert?: CaptureInsert): Promise<void> => ipcRenderer.invoke('flownote:capture:edit', insert),
    arm: (insert?: CaptureInsert): Promise<void> => ipcRenderer.invoke('flownote:capture:arm', insert),
    described: (
      stepId: string,
      description: string | null,
      failure: AiFailureUpdate | null,
      source: 'ai' | 'narration' = 'ai',
    ): void => ipcRenderer.send('flownote:capture:described', stepId, description, failure, source),
    narration: (narration: OverlayNarration | null): void => ipcRenderer.send('flownote:capture:narration', narration),
    settings: {
      get: (): Promise<CaptureSettings> => ipcRenderer.invoke('flownote:capture:settings:get'),
      set: (patch: Partial<CaptureSettings>): Promise<CaptureSettings> =>
        ipcRenderer.invoke('flownote:capture:settings:set', patch),
    },
    onOpenSheet: (handler: () => void): void => {
      ipcRenderer.on('flownote:capture:openSheet', () => handler());
    },
    getState: (): Promise<DesktopStateUpdate> => ipcRenderer.invoke('flownote:capture:getState'),
    onStateUpdate: (handler: (update: DesktopStateUpdate) => void): void => {
      ipcRenderer.on('flownote:capture:stateUpdate', (_event, update: DesktopStateUpdate) => handler(update));
    },
  },
  meetings: {
    sources: (): Promise<MeetingSourceOption[]> => ipcRenderer.invoke('flownote:meetings:sources'),
    systemAudio: (): Promise<SystemAudioSupport> => ipcRenderer.invoke('flownote:meetings:systemAudio'),
    choose: (sourceId: string | null): Promise<void> => ipcRenderer.invoke('flownote:meetings:choose', sourceId),
  },
  microphone: {
    get: (): Promise<MicrophoneAccess> => ipcRenderer.invoke('flownote:microphone:get'),
    request: (): Promise<MicrophoneAccess> => ipcRenderer.invoke('flownote:microphone:request'),
  },
  permissions: {
    get: (): Promise<CapturePermissions & { pending: boolean }> => ipcRenderer.invoke('flownote:permissions:get'),
    request: (kind: PermissionKind): Promise<void> => ipcRenderer.invoke('flownote:permissions:request', kind),
    continue: (): void => ipcRenderer.send('flownote:permissions:continue'),
    cancel: (): void => ipcRenderer.send('flownote:permissions:cancel'),
    restart: (): void => ipcRenderer.send('flownote:permissions:restart'),
    onShow: (handler: () => void): void => {
      ipcRenderer.on('flownote:permissions:show', () => handler());
    },
  },
  ai: {
    fetch: (request: unknown): Promise<unknown> => ipcRenderer.invoke('flownote:ai:fetch', request),
    abort: (id: string): void => ipcRenderer.send('flownote:ai:abort', id),
  },
  onRequest: <K extends RendererRequest>(
    channel: K,
    handler: (payload: RendererRequests[K][0]) => Promise<RendererRequests[K][1]> | RendererRequests[K][1],
  ): void => {
    ipcRenderer.on(channel, async (_event, replyChannel: string, payload: RendererRequests[K][0]) => {
      try {
        ipcRenderer.send(replyChannel, await handler(payload));
      } catch (error) {
        ipcRenderer.send(replyChannel, { error: error instanceof Error ? error.message : String(error) });
      }
    });
  },
  onOpen: (handler: (target: 'library' | 'capture' | 'settings') => void): void => {
    ipcRenderer.on('flownote:app:open', (_event, target) => handler(target));
  },
  screenshots: {
    sweep: (keep: string[]): Promise<number> => ipcRenderer.invoke('flownote:screenshots:sweep', keep),
  },
  openedFile: {
    take: (): Promise<{ name: string; bytes: Uint8Array } | null> => ipcRenderer.invoke('flownote:app:takeOpenedFile'),
    onOpen: (handler: () => void): void => {
      ipcRenderer.on('flownote:app:fileOpened', () => handler());
    },
  },
  openAtLogin: {
    get: (): Promise<boolean> => ipcRenderer.invoke('flownote:openAtLogin:get'),
    set: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('flownote:openAtLogin:set', enabled),
  },
};

contextBridge.exposeInMainWorld('flownote', api);

export type FlowNoteDesktopApi = typeof api;
