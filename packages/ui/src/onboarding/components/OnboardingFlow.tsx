import { type ReactNode, useState } from 'react';
import { MascotIcon } from '../../common/components/MascotIcon';
import { MakeItYoursStep } from './MakeItYoursStep';
import { ReadyStep } from './ReadyStep';
import { WelcomeStep } from './WelcomeStep';
import { WriteStepsStep } from './WriteStepsStep';

interface OnboardingFlowProps {
  extraRows?: ReactNode;
  readyAside: ReactNode;
  onFinish: () => void;
}

export function OnboardingFlow({ extraRows, readyAside, onFinish }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center gap-2 px-6 pt-5 text-[17px] font-bold">
        <MascotIcon size={32} />
        FlowNote
      </header>
      <main
        className={`mx-auto flex w-full flex-1 flex-col justify-center gap-3.5 px-4 py-6 ${step === 3 ? 'max-w-[1040px]' : 'max-w-[640px]'}`}
      >
        {step === 0 && <WelcomeStep onNext={next} />}
        {step === 1 && <WriteStepsStep onNext={next} onBack={back} />}
        {step === 2 && <MakeItYoursStep onNext={next} onBack={back} extraRows={extraRows} />}
        {step === 3 && <ReadyStep aside={readyAside} onNext={onFinish} />}
      </main>
    </div>
  );
}
