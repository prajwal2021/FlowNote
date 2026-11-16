import {
  VOICE_OFFSCREEN_TARGET,
  VoiceMessage,
  type VoiceStartRequest,
  type VoiceStartResponse,
  voiceMessage,
} from '../voice/voice-message';
import { answered } from './answered';

const START_ATTEMPTS = 12;
const RETRY_MS = 250;

export async function startVoiceCapture(deviceId?: string): Promise<VoiceStartResponse> {
  const message = voiceMessage<VoiceStartRequest>({
    type: VoiceMessage.VOICE_START,
    target: VOICE_OFFSCREEN_TARGET,
    deviceId,
  });
  for (let attempt = 0; attempt < START_ATTEMPTS; attempt++) {
    const response = await answered<VoiceStartResponse | undefined>(message, undefined);
    if (response) return response;
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  }
  return { started: false, reason: 'unsupported', error: 'No microphone host answered after waiting 3 seconds' };
}
