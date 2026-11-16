import { i18n } from '@flownote/core/env';
import { MascotIcon } from '../../common/components/MascotIcon';
import { StepNav } from './StepNav';

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <section className="flex flex-col items-center gap-3.5 rounded-[18px] border border-lavender/60 bg-card px-7 py-9 text-center max-[640px]:px-4">
        <MascotIcon size={96} />
        <h1 className="text-[26px] leading-tight font-bold text-balance text-foreground">
          {i18n.t('onboarding.helloTitle')}
        </h1>
        <p className="max-w-[52ch] text-[13.5px] text-muted-foreground">{i18n.t('onboarding.helloMessage')}</p>
      </section>
      <StepNav onNext={onNext} nextLabel={i18n.t('onboarding.getStarted')} />
    </>
  );
}
