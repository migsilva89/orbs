import { authedRouter } from './rpc.procedures';

export const notifications = {
  settings: authedRouter.notifications.settings.handler(async ({ context }) => context.notifications.queries.settings()),
  configure: authedRouter.notifications.configure.handler(async ({ context, input }) => context.notifications.actions.configure(input)),
  presence: authedRouter.notifications.presence.handler(({ context, input }) => {
    context.notifications.actions.presence({ ...input, deviceId: context.device.id });
  }),
  push: authedRouter.notifications.push.handler(async ({ context, input }) => context.notifications.actions.push({ ...input, deviceId: context.device.id })),
};
