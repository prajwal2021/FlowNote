import type { Screenshot, Step } from '@flownote/core/guides/types';

export interface PreviewData {
  snapshotId: string;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
}
