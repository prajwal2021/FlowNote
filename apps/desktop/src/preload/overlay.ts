import type { Rect } from '@flownote/core/rect';
import { contextBridge, ipcRenderer } from 'electron';
import type { OverlayView } from '../main/overlay';

const api = {
  region: (): Promise<Rect> => ipcRenderer.invoke('flownote:overlay:region'),
  view: (): Promise<OverlayView> => ipcRenderer.invoke('flownote:overlay:view'),
  setRegion: (region: Rect): void => ipcRenderer.send('flownote:overlay:setRegion', region),
  command: (command: string): void => ipcRenderer.send('flownote:overlay:command', command),
  size: (width: number, height: number): void => ipcRenderer.send('flownote:overlay:size', width, height),
  onUpdate: (handler: (view: OverlayView) => void): void => {
    ipcRenderer.on('flownote:overlay:update', (_event, view: OverlayView) => handler(view));
  },
};

contextBridge.exposeInMainWorld('flownoteOverlay', api);

export type FlowNoteOverlayApi = typeof api;
