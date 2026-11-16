import { OnboardingFlow } from '@flownote/ui';
import { openFlowNote } from './lib/open-flownote';
import { BlurRow } from './steps/BlurRow';
import { PinCard } from './steps/PinCard';

export function OnboardingApp() {
  return <OnboardingFlow extraRows={<BlurRow />} readyAside={<PinCard />} onFinish={() => void openFlowNote()} />;
}
