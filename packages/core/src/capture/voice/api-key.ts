import { API_KEY_SETTINGS, type ApiKeySettings, orgAiAccess, readApiKeys } from '@/core/capture/ai/keys';
import type { VoiceProvider } from './transcribe';

export const VOICE_KEY_SETTINGS = API_KEY_SETTINGS;

export type VoiceKeySettings = ApiKeySettings;

export interface ResolvedVoiceApiKey {
  provider: VoiceProvider;
  apiKey: string;
  baseUrl?: string;
}

export function normalizeVoiceProvider(value: unknown): VoiceProvider {
  return value === 'groq' ? 'groq' : 'openai';
}

export function resolveVoiceApiKey(settings: VoiceKeySettings): ResolvedVoiceApiKey {
  const provider = normalizeVoiceProvider(settings.voiceProvider);
  const own = readApiKeys(settings)[provider] ?? '';
  if (own) return { provider, apiKey: own };
  const org = provider === 'openai' ? orgAiAccess(settings) : null;
  return org ? { provider, apiKey: org.token, baseUrl: org.baseUrl } : { provider, apiKey: '' };
}

export function hasVoiceApiKey(settings: VoiceKeySettings): boolean {
  return resolveVoiceApiKey(settings).apiKey.length > 0;
}
