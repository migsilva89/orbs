import { authedRouter } from './rpc.procedures';

export const rpcServer = {
  info: authedRouter.server.info.handler(async ({ context }) => context.server.queries.info()),
  configure: authedRouter.server.configure.handler(async ({ context, input }) => context.server.actions.configure(input)),
};
