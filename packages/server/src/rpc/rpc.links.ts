import { authedRouter } from './rpc.procedures';

export const links = {
  preview: authedRouter.links.preview.handler(async ({ context, input }) => context.links.queries.preview(input)),
};
