import { OnboardingFlow } from '@flownote/ui';
import { StartAtLoginRow } from './onboarding/StartAtLoginRow';
import { TrayCard } from './onboarding/TrayCard';

export function DesktopOnboarding({ onFinish }: { onFinish: () => void }) {
  return <OnboardingFlow extraRows={<StartAtLoginRow />} readyAside={<TrayCard />} onFinish={onFinish} />;
}
