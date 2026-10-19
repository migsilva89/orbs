import { authedRouter } from './rpc.procedures';

export const artifacts = {
  list: authedRouter.artifacts.list.handler(async ({ context, input }) => context.artifacts.queries.list(input)),
  listBot: authedRouter.artifacts.listBot.handler(async ({ context, input }) => context.artifacts.queries.listBot(input)),
  get: authedRouter.artifacts.get.handler(async ({ context, input }) => context.artifacts.queries.get(input)),
  versions: authedRouter.artifacts.versions.handler(async ({ context, input }) => context.artifacts.queries.versions(input)),
  blocks: authedRouter.artifacts.blocks.handler(async ({ context }) => context.artifacts.queries.blocks()),
  create: authedRouter.artifacts.create.handler(async ({ context, input }) => context.artifacts.actions.create(input)),
  update: authedRouter.artifacts.update.handler(async ({ context, input }) => context.artifacts.actions.update(input)),
  saveState: authedRouter.artifacts.saveState.handler(async ({ context, input }) => context.artifacts.actions.saveState(input)),
  restore: authedRouter.artifacts.restore.handler(async ({ context, input }) => context.artifacts.actions.restore(input)),
};
