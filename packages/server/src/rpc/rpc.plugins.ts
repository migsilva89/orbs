import { authedRouter } from './rpc.procedures';

export const plugins = authedRouter.plugins.router({
  discover: authedRouter.plugins.discover.handler(async ({ context, input }) => context.bots.queries.plugins(input)),
  settings: authedRouter.plugins.settings.handler(async ({ context }) => context.plugins.queries.settings()),
  configure: authedRouter.plugins.configure.handler(async ({ context, input }) => context.plugins.actions.configure(input)),
});
