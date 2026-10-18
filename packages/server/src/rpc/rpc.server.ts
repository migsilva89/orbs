import { authedRouter } from './rpc.procedures';

export const rpcServer = authedRouter.server.router({
  info: authedRouter.server.info.handler(async ({ context }) => context.server.queries.info()),
});
