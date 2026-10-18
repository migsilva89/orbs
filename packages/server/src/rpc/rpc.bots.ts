import { authedRouter } from './rpc.procedures';

export const bots = authedRouter.bots.router({
  models: authedRouter.bots.models.handler(async ({ context }) => context.bots.queries.models()),
  list: authedRouter.bots.list.handler(async ({ context }) => context.bots.queries.list()),
  get: authedRouter.bots.get.handler(async ({ context, input }) => context.bots.queries.get(input)),
  create: authedRouter.bots.create.handler(async ({ context, input }) => context.bots.actions.create(input)),
  update: authedRouter.bots.update.handler(async ({ context, input }) => context.bots.actions.update(input)),
  catalog: authedRouter.bots.catalog.handler(async ({ context, input }) => context.bots.queries.catalog(input)),
});
