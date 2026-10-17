import { authedRouter } from './rpc.procedures';

export const tools = authedRouter.tools.router({
  settings: authedRouter.tools.settings.handler(async ({ context }) => context.tools.queries.settings()),
  configure: authedRouter.tools.configure.handler(async ({ context, input }) => context.tools.actions.configure(input)),
  pending: authedRouter.tools.pending.handler(async ({ context, input }) => context.conversation.queries.approvals(input)),
  answer: authedRouter.tools.answer.handler(async ({ context, input }) => (
    context.conversation.actions.approve({ ...input, answeredBy: context.device.id })
  )),
});
