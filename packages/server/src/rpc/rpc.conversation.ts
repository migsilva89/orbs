import { authedRouter } from './rpc.procedures';

export const conversation = authedRouter.conversation.router({
  watch: authedRouter.conversation.watch.handler(async ({ context, signal }) => {
    return context.conversation.watch({
      deviceId: context.device.id,
      authorization: context.reqHeaders?.get('authorization'),
      signal,
    });
  }),
});
