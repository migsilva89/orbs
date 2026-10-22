import { authedRouter } from './rpc.procedures';

export const secrets = {
  list: authedRouter.secrets.list.handler(async ({ context }) => context.secrets.queries.rules()),
  save: authedRouter.secrets.save.handler(async ({ context, input }) => context.secrets.actions.save(input)),
  remove: authedRouter.secrets.remove.handler(async ({ context, input }) => context.secrets.actions.remove(input)),
  settings: authedRouter.secrets.settings.handler(async ({ context }) => context.secrets.queries.settings()),
  configure: authedRouter.secrets.configure.handler(async ({ context, input }) => context.secrets.actions.configure(input)),
};
