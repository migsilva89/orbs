import { authedRouter } from './rpc.procedures';

export const providers = {
  list: authedRouter.providers.list.handler(async ({ context }) => context.providers.queries.list({ deviceId: context.device.id })),
  login: authedRouter.providers.login.handler(async ({ context, input }) => context.providers.actions.login({
    ...input,
    deviceId: context.device.id,
    serverId: (await context.server.queries.info()).id,
  })),
  complete: authedRouter.providers.complete.handler(async ({ context, input }) => context.providers.actions.complete({
    ...input,
    deviceId: context.device.id,
  })),
  session: authedRouter.providers.session.handler(async ({ context, input }) => context.providers.queries.session({ ...input, deviceId: context.device.id })),
  cancel: authedRouter.providers.cancel.handler(async ({ context, input }) => context.providers.actions.cancel({ ...input, deviceId: context.device.id })),
  logout: authedRouter.providers.logout.handler(async ({ context, input }) => context.providers.actions.logout(input)),
};
