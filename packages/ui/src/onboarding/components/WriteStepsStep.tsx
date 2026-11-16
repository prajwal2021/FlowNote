import { i18n } from '@flownote/core/env';
import type { StepProps } from '../types';
import { OnboardingCard } from './OnboardingCard';
import { StepNav } from './StepNav';
import { WritingExample } from './WritingExample';

export function WriteStepsStep({ onNext, onBack }: StepProps) {
  return (
    <>
      <OnboardingCard title={i18n.t('onboarding.writeTitle')} message={i18n.t('onboarding.writeMessage')}>
        <div className="grid w-full grid-cols-2 gap-3 max-[640px]:grid-cols-1">
          <WritingExample
            badge={i18n.t('stepSource.basic')}
            example={i18n.t('onboarding.basicExample')}
            title={i18n.t('onboarding.basicTitle')}
            message={i18n.t('onboarding.basicMessage')}
          />
          <WritingExample
            ai
            badge={i18n.t('stepSource.ai')}
            example={i18n.t('onboarding.aiExample')}
            title={i18n.t('onboarding.aiChoiceTitle')}
            message={i18n.t('onboarding.aiChoiceMessageNoVoice')}
          />
        </div>
        <p className="text-center text-[11.5px] text-muted-foreground">{i18n.t('onboarding.writeKeyHint')}</p>
      </OnboardingCard>
      <StepNav onNext={onNext} onBack={onBack} />
    </>
  );
}
