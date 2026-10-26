import { env } from '@repo/env/client';
import { m } from '@repo/i18n/client';
import { Link } from '@tanstack/react-router';
import { OnboardingSceneWelcome } from '@/components/onboarding/onboarding-scene-welcome';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { OnboardingStepList } from '@/components/onboarding/onboarding-step-list';
import { Button } from '@/components/ui/button';
import IconBot from '~icons/lucide/bot';
import IconKeyRound from '~icons/lucide/key-round';
import IconShieldCheck from '~icons/lucide/shield-check';

export function OnboardingStepWelcome() {
  return (
    <OnboardingStepLayout
      actions={(
        <Button asChild>
          <Link params={{ step: 'model' }} to="/onboarding/$step">{m.onboarding_welcome_start()}</Link>
        </Button>
      )}
      description={m.onboarding_welcome_description()}
      scene={<OnboardingSceneWelcome />}
      title={m.onboarding_welcome_title({ name: env.VITE_APP_NAME })}
    >
      <OnboardingStepList
        items={[
          { icon: IconKeyRound, label: m.onboarding_welcome_model() },
          { icon: IconShieldCheck, label: m.onboarding_welcome_approvals() },
          { icon: IconBot, label: m.onboarding_welcome_bot() },
        ]}
      />
    </OnboardingStepLayout>
  );
}
