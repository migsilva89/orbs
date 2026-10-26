import { env } from '@repo/env/client';
import { m } from '@repo/i18n/client';
import { Link } from '@tanstack/react-router';
import { OnboardingSceneWelcome } from '@/components/onboarding/onboarding-scene-welcome';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { Button } from '@/components/ui/button';
import IconBot from '~icons/lucide/bot';
import IconKeyRound from '~icons/lucide/key-round';
import IconShieldCheck from '~icons/lucide/shield-check';

const ITEMS = [
  { icon: IconKeyRound, label: m.onboarding_welcome_model },
  { icon: IconShieldCheck, label: m.onboarding_welcome_approvals },
  { icon: IconBot, label: m.onboarding_welcome_bot },
];

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
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li className="flex items-center gap-3 text-sm" key={label()}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </span>
            {label()}
          </li>
        ))}
      </ol>
    </OnboardingStepLayout>
  );
}
