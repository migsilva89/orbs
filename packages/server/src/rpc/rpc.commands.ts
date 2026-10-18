import { authedRouter } from './rpc.procedures';

export const commands = authedRouter.commands.router({
  list: authedRouter.commands.list.handler(async ({ context, input }) => context.conversation.queries.commands(input)),
  execute: authedRouter.commands.execute.handler(async ({ context, input }) => context.conversation.actions.executeCommand(input)),
});
