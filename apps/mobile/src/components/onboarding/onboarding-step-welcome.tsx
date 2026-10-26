import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { Bot, KeyRound, ShieldCheck } from 'lucide-react-native';
import { OnboardingSceneWelcome } from '@/components/onboarding/onboarding-scene-welcome';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { OnboardingStepList } from '@/components/onboarding/onboarding-step-list';
import { Button } from '@/components/ui/button';
import { BRAND_APP_NAME } from '@/services/brand/brand.constants';

export function OnboardingStepWelcome() {
  const router = useRouter();

  return (
    <OnboardingStepLayout
      description={m.onboarding_welcome_description()}
      primary={(
        <Button
          className="w-full"
          size="lg"
          onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'model' } })}
        >
          {m.onboarding_welcome_start()}
        </Button>
      )}
      scene={<OnboardingSceneWelcome />}
      step="welcome"
      title={m.onboarding_welcome_title({ name: BRAND_APP_NAME })}
    >
      <OnboardingStepList
        items={[
          { icon: KeyRound, label: m.onboarding_welcome_model() },
          { icon: ShieldCheck, label: m.onboarding_welcome_approvals() },
          { icon: Bot, label: m.onboarding_welcome_bot() },
        ]}
      />
    </OnboardingStepLayout>
  );
}
