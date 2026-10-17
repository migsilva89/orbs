import { authedRouter } from './rpc.procedures';

export const conversation = authedRouter.conversation.router({
  submit: authedRouter.conversation.submit.handler(async ({ context, input }) => context.conversation.actions.submit(input)),
  stop: authedRouter.conversation.stop.handler(async ({ context }) => context.conversation.actions.stop()),
  watch: authedRouter.conversation.watch.handler(async ({ context, signal }) => {
    return context.conversation.watch({
      deviceId: context.device.id,
      authorization: context.reqHeaders?.get('authorization'),
      signal,
    });
  }),
});
