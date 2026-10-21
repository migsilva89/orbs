import { authedRouter } from './rpc.procedures';

export const devices = {
  list: authedRouter.devices.list.handler(async ({ context }) => context.auth.queries.devices()),
  revoke: authedRouter.devices.revoke.handler(async ({ context, input }) => context.auth.actions.revoke(input)),
  push: authedRouter.devices.push.handler(async ({ context, input }) => context.push.actions.register({ deviceId: context.device.id, token: input.token })),
};
