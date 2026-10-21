import { authedRouter } from './rpc.procedures';

export const avatars = {
  upload: authedRouter.avatars.upload.handler(async ({ context, input }) => context.avatars.actions.upload(input)),
};
