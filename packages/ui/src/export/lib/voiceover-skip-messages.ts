import type { VoiceoverSkip } from '@flownote/core/export/video-export';

export const VOICEOVER_SKIP_MESSAGES = {
  failed: 'exportPreview.voiceoverFailed',
  noAudioCodec: 'exportPreview.voiceoverNoAudioCodec',
  noKey: 'exportPreview.voiceoverNoKeySkip',
  nothingToSay: 'exportPreview.voiceoverNothingToSay',
} as const satisfies Record<VoiceoverSkip['reason'], string>;
