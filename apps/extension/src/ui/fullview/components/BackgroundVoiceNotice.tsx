import { VoiceNotice } from '@flownote/ui';
import { browser } from '#imports';
import { useBackgroundVoice } from '../hooks/use-background-voice';

export function BackgroundVoiceNotice() {
  const { update, seenLive } = useBackgroundVoice();
  return <VoiceNotice update={update} seenLive={seenLive} onOpenSettings={() => browser.runtime.openOptionsPage()} />;
}
