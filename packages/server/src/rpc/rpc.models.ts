import { authedRouter } from './rpc.procedures';

export const models = {
  list: authedRouter.models.list.handler(async ({ context }) => context.runtime.queries.models()),
};
