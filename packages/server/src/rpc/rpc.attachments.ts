import { authedRouter } from './rpc.procedures';

export const attachments = {
  upload: authedRouter.attachments.upload.handler(({ context, input }) => context.attachments.actions.upload(input)),
  download: authedRouter.attachments.download.handler(({ context, input }) => context.attachments.queries.download(input)),
  list: authedRouter.attachments.list.handler(({ context, input }) => context.attachments.queries.list(input)),
  remove: authedRouter.attachments.remove.handler(({ context, input }) => context.attachments.actions.remove(input)),
};
