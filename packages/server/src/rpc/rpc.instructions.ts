import { authedRouter } from './rpc.procedures';

export const instructions = {
  discover: authedRouter.instructions.discover.handler(async ({ context, input }) => context.bots.queries.instructions(input)),
  settings: authedRouter.instructions.settings.handler(async ({ context }) => context.instructions.queries.settings()),
  configure: authedRouter.instructions.configure.handler(async ({ context, input }) => context.instructions.actions.configure(input)),
};
