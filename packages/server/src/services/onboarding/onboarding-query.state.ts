import { onboardingState } from '@repo/contracts/universal';
import { ONBOARDING } from './onboarding.constants';
import type { OnboardingServiceDeps } from '../../types/onboarding.types';

export async function onboardingQueryState({ settings }: OnboardingServiceDeps) {
  const stored = (await settings.queries.get({ keys: [ONBOARDING.completedSetting] })).at(0);

  return onboardingState.parse({ completedAt: stored ? Number(stored.value) : null });
}
