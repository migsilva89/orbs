import { onboardingStep } from '@repo/contracts/universal';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { match } from 'ts-pattern';
import { OnboardingStepApprovals } from '@/components/onboarding/onboarding-step-approvals';
import { OnboardingStepBot } from '@/components/onboarding/onboarding-step-bot';
import { OnboardingStepDone } from '@/components/onboarding/onboarding-step-done';
import { OnboardingStepModel } from '@/components/onboarding/onboarding-step-model';
import { OnboardingStepWelcome } from '@/components/onboarding/onboarding-step-welcome';
import type { OnboardingRouteParams } from '@/types/onboarding.types';

export function OnboardingScreen() {
  const { step } = useLocalSearchParams<OnboardingRouteParams>();
  const parsed = onboardingStep.safeParse(step);

  if (!parsed.success) {
    return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: 'welcome' } }} />;
  }

  return match(parsed.data)
    .with('welcome', () => <OnboardingStepWelcome />)
    .with('model', () => <OnboardingStepModel />)
    .with('approvals', () => <OnboardingStepApprovals />)
    .with('bot', () => <OnboardingStepBot />)
    .with('done', () => <OnboardingStepDone />)
    .exhaustive();
}
