import { authedRouter } from './rpc.procedures';

export const sidebarSections = {
  list: authedRouter.sidebarSections.list.handler(async ({ context }) => context.sidebarSections.queries.list()),
  create: authedRouter.sidebarSections.create.handler(async ({ context, input }) => context.sidebarSections.actions.create(input)),
  rename: authedRouter.sidebarSections.rename.handler(async ({ context, input }) => context.sidebarSections.actions.rename(input)),
  remove: authedRouter.sidebarSections.remove.handler(async ({ context, input }) => context.sidebarSections.actions.remove(input)),
  arrange: authedRouter.sidebarSections.arrange.handler(async ({ context, input }) => context.sidebarSections.actions.arrange(input)),
  setCollapsed: authedRouter.sidebarSections.setCollapsed.handler(async ({ context, input }) => context.sidebarSections.actions.setCollapsed(input)),
};
