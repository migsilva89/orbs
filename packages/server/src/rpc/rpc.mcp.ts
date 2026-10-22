import { authedRouter } from './rpc.procedures';

export const mcp = {
  discover: authedRouter.mcp.discover.handler(async ({ context, input }) => context.bots.queries.mcp(input)),
  connect: authedRouter.mcp.connect.handler(async ({ context, input }) => context.bots.actions.connectMcp(input)),
  settings: authedRouter.mcp.settings.handler(async ({ context }) => context.mcp.queries.settings()),
  configure: authedRouter.mcp.configure.handler(async ({ context, input }) => context.mcp.actions.configure(input)),
};
