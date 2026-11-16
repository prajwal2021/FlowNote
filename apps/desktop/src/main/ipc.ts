import type { CaptureStateUpdate } from '@flownote/core/capture/capture-state-update';
import type { CaptureStepData } from '@flownote/core/capture/sink';
import type { OverlayCommand } from './overlay';

export interface DesktopStateUpdate extends CaptureStateUpdate {
  command: OverlayCommand | null;
  narrationWasLive: boolean;
}

export type DesktopCaptureStepData = CaptureStepData & {
  inputValue?: string;
  zoomLevel?: number;
};

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

export interface RendererRequests {
  'flownote:capture:createGuide': [{ guideId?: string | null; staging?: boolean }, string];
  'flownote:capture:captureStep': [DesktopCaptureStepData, { stepId: string; title: string; pending: boolean }];
  'flownote:capture:deleteStep': [{ guideId: string; stepId: string }, boolean];
  'flownote:capture:discardRecording': [{ guideId: string; staging: boolean }, boolean];
  'flownote:capture:finishGuide': [string, boolean];
  'flownote:capture:mergeGuideInto': [{ guideId: string; insertTargetGuideId: string; insertAtIndex: number }, boolean];
  'flownote:check:cleanup': [string[], boolean];
  'flownote:check:defaultLogo': [undefined, boolean];
  'flownote:check:screenshotIds': [undefined, string[]];
  'flownote:check:screenshotSrc': [string, string | null];
  'flownote:check:steps': [string, string[] | null];
  'flownote:check:title': [string, string | null];
  'flownote:check:trashed': [string, boolean | null];
  'flownote:check:verify': [string, CheckResult[]];
}

export type RendererRequest = keyof RendererRequests;
