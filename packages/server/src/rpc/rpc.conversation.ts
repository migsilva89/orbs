import { authedRouter } from './rpc.procedures';

export const conversation = authedRouter.conversation.router({
  history: authedRouter.conversation.history.handler(async ({ context, input }) => context.conversation.queries.history(input)),
  submit: authedRouter.conversation.submit.handler(async ({ context, input }) => context.conversation.actions.submit(input)),
  stop: authedRouter.conversation.stop.handler(async ({ context, input }) => context.conversation.actions.stop(input)),
  watch: authedRouter.conversation.watch.handler(async ({ context, input, signal }) => {
    return context.conversation.watch({
      botId: input.botId,
      conversationId: input.conversationId,
      deviceId: context.device.id,
      authorization: context.reqHeaders?.get('authorization'),
      signal,
    });
  }),
});
