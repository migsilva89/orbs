import { authedRouter } from './rpc.procedures';

export const activity = {
  list: authedRouter.activity.list.handler(async ({ context, input }) => context.activity.queries.list(input)),
  run: authedRouter.activity.run.handler(async ({ context, input }) => context.activity.queries.run(input)),
};
