import { authedRouter } from './rpc.procedures';

export const onboarding = {
  state: authedRouter.onboarding.state.handler(async ({ context }) => context.onboarding.queries.state()),
  complete: authedRouter.onboarding.complete.handler(async ({ context }) => context.onboarding.actions.complete()),
};
