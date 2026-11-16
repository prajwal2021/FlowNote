import { readAiCredentials } from '@/core/capture/ai/read-ai-credentials';
import { i18n } from '@/core/env';
import type { MeetingAiConfig } from './generate-meeting-insights';

export async function readMeetingAi(): Promise<MeetingAiConfig | null> {
  const credentials = await readAiCredentials().catch(() => null);
  if (!credentials) return null;
  return {
    ...credentials,
    youLabel: i18n.t('meetings.speakerYou'),
    othersLabel: i18n.t('meetings.speakerOthers'),
  };
}
