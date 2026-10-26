import { onboardingQueryState } from './onboarding-query.state';
import { ONBOARDING } from './onboarding.constants';
import type { OnboardingServiceDeps } from '../../types/onboarding.types';

export async function onboardingActionComplete(deps: OnboardingServiceDeps) {
  await deps.settings.actions.ensure({ key: ONBOARDING.completedSetting, value: String(Date.now()) });

  return onboardingQueryState(deps);
}
