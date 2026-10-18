import { authedRouter } from './rpc.procedures';

export const credentials = authedRouter.credentials.router({
  list: authedRouter.credentials.list.handler(async ({ context }) => context.credentials.queries.list()),
  set: authedRouter.credentials.set.handler(async ({ context, input }) => context.credentials.actions.set(input)),
});
