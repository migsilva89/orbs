import { authedRouter } from './rpc.procedures';

export const mcpAuth = {
  start: authedRouter.mcpAuth.start.handler(async ({ context, input }) => context.mcpAuth.actions.start({
    ...input,
    deviceId: context.device.id,
    authorization: context.reqHeaders?.get('authorization'),
  })),
  complete: authedRouter.mcpAuth.complete.handler(async ({ context, input }) => context.mcpAuth.actions.complete({ ...input, deviceId: context.device.id })),
  cancel: authedRouter.mcpAuth.cancel.handler(async ({ context, input }) => context.mcpAuth.actions.cancel({ ...input, deviceId: context.device.id })),
  logout: authedRouter.mcpAuth.logout.handler(async ({ context, input }) => context.mcpAuth.actions.logout(input)),
  status: authedRouter.mcpAuth.status.handler(async ({ context, input }) => context.mcpAuth.queries.status({ ...input, deviceId: context.device.id })),
};
