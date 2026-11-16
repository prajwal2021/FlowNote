import type { FlowNoteDesktopApi } from './preload/index';
import type { FlowNoteOverlayApi } from './preload/overlay';

declare global {
  interface ImportMetaEnv {
    readonly COMMAND?: string;
    readonly BROWSER?: string;
  }

  interface Window {
    flownote: FlowNoteDesktopApi;
    flownoteOverlay: FlowNoteOverlayApi;
  }
}
