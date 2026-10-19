import { authedRouter } from './rpc.procedures';

export const rpcServer = {
  info: authedRouter.server.info.handler(async ({ context }) => context.server.queries.info()),
};
