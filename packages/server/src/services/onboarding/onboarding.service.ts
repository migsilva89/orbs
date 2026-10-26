import { onboardingActionComplete } from './onboarding-action.complete';
import { onboardingQueryState } from './onboarding-query.state';
import type { OnboardingServiceDeps } from '../../types/onboarding.types';

export function makeOnboardingService(deps: OnboardingServiceDeps) {
  return {
    actions: {
      complete: () => onboardingActionComplete(deps),
    },
    queries: {
      state: () => onboardingQueryState(deps),
    },
  };
}

export type OnboardingService = ReturnType<typeof makeOnboardingService>;
