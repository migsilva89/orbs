import { useParams } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import { OnboardingStepApprovals } from '@/components/onboarding/onboarding-step-approvals';
import { OnboardingStepBot } from '@/components/onboarding/onboarding-step-bot';
import { OnboardingStepDone } from '@/components/onboarding/onboarding-step-done';
import { OnboardingStepModel } from '@/components/onboarding/onboarding-step-model';
import { OnboardingStepWelcome } from '@/components/onboarding/onboarding-step-welcome';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function OnboardingPage() {
  const { step } = useParams({ from: '/_chat/onboarding/$step' });

  return (
    <Dialog open>
      <DialogContent
        className="max-w-md overflow-hidden md:max-w-4xl"
        close={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="-m-5 grid h-[min(37.5rem,calc(100svh-4rem))] md:grid-cols-2">
          {match(step)
            .with('welcome', () => <OnboardingStepWelcome />)
            .with('model', () => <OnboardingStepModel />)
            .with('approvals', () => <OnboardingStepApprovals />)
            .with('bot', () => <OnboardingStepBot />)
            .with('done', () => <OnboardingStepDone />)
            .exhaustive()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
