export const USAGE_KEY = 'flownoteUsage';

export interface Usage {
  plan: 'free' | 'pro';
  recordingsUsed: number;
  recordingLimit: number | null;
  renewsAt: string | null;
  billingEnabled: boolean;
}

export interface StoredUsage extends Usage {
  blocked: boolean;
}
