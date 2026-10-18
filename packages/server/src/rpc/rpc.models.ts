import { authedRouter } from './rpc.procedures';

export const models = authedRouter.models.router({
  list: authedRouter.models.list.handler(async ({ context }) => context.runtime.queries.models()),
});
