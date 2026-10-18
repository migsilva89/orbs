import { authedRouter } from './rpc.procedures';

export const routines = authedRouter.routines.router({
  list: authedRouter.routines.list.handler(async ({ context, input }) => context.routines.queries.list(input)),
  create: authedRouter.routines.create.handler(async ({ context, input }) => context.routines.actions.create(input)),
  update: authedRouter.routines.update.handler(async ({ context, input }) => context.routines.actions.update(input)),
  run: authedRouter.routines.run.handler(async ({ context, input }) => context.routines.actions.run(input)),
  remove: authedRouter.routines.remove.handler(async ({ context, input }) => context.routines.actions.remove(input)),
});
