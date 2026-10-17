import { authedRouter } from './rpc.procedures';

export const resources = authedRouter.resources.router({
  discover: authedRouter.resources.discover.handler(async ({ context, input }) => context.bots.queries.resources(input)),
  settings: authedRouter.resources.settings.handler(async ({ context }) => context.resources.queries.settings()),
  configure: authedRouter.resources.configure.handler(async ({ context, input }) => context.resources.actions.configure(input)),
});
