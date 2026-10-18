import { authedRouter } from './rpc.procedures';

export const skills = authedRouter.skills.router({
  discover: authedRouter.skills.discover.handler(async ({ context, input }) => context.bots.queries.skills(input)),
  settings: authedRouter.skills.settings.handler(async ({ context }) => context.skills.queries.settings()),
  configure: authedRouter.skills.configure.handler(async ({ context, input }) => context.skills.actions.configure(input)),
});
