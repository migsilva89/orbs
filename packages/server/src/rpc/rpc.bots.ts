import { authedRouter } from './rpc.procedures';

export const bots = {
  swapModels: authedRouter.bots.swapModels.handler(async ({ context, input }) => context.bots.actions.swapModels(input)),
  list: authedRouter.bots.list.handler(async ({ context }) => context.bots.queries.list()),
  get: authedRouter.bots.get.handler(async ({ context, input }) => context.bots.queries.get(input)),
  create: authedRouter.bots.create.handler(async ({ context, input }) => context.bots.actions.create(input)),
  update: authedRouter.bots.update.handler(async ({ context, input }) => context.bots.actions.update(input)),
  delete: authedRouter.bots.delete.handler(async ({ context, input }) => context.bots.actions.delete(input)),
  catalog: authedRouter.bots.catalog.handler(async ({ context, input }) => context.bots.queries.catalog(input)),
  usage: authedRouter.bots.usage.handler(async ({ context, input }) => context.bots.queries.usage(input)),
};
