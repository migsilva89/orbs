import { authedRouter } from './rpc.procedures';

export const conversation = authedRouter.conversation.router({
  search: authedRouter.conversation.search.handler(async ({ context, input }) => context.conversation.queries.search(input)),
  questions: authedRouter.conversation.questions.handler(async ({ context, input }) => context.conversation.queries.questions(input)),
  answerQuestion: authedRouter.conversation.answerQuestion.handler(async ({ context, input }) => context.conversation.actions.answerQuestion({
    ...input,
    answeredBy: context.device.id,
  })),
  setReaction: authedRouter.conversation.setReaction.handler(async ({ context, input }) => context.conversation.actions.setReaction(input)),
  reactions: authedRouter.conversation.reactions.handler(async ({ context, input }) => context.conversation.queries.reactions(input)),
  setHidden: authedRouter.conversation.setHidden.handler(async ({ context, input }) => context.conversation.actions.setHidden(input)),
  setMuted: authedRouter.conversation.setMuted.handler(async ({ context, input }) => context.conversation.actions.setMuted(input)),
  arrange: authedRouter.conversation.arrange.handler(async ({ context, input }) => context.conversation.actions.arrange(input)),

  contextUsage: authedRouter.conversation.contextUsage.handler(async ({ context, input }) => context.conversation.queries.contextUsage(input)),
  watchContexts: authedRouter.conversation.watchContexts.handler(async ({ context, input, signal }) => context.conversation.watchContexts({
    ...input,
    deviceId: context.device.id,
    authorization: context.reqHeaders?.get('authorization'),
    signal,
  })),
  usage: authedRouter.conversation.usage.handler(async ({ context, input }) => context.conversation.queries.usage(input)),
  contexts: authedRouter.conversation.contexts.handler(async ({ context, input }) => context.conversation.queries.contexts(input)),
  markRead: authedRouter.conversation.markRead.handler(async ({ context, input }) => context.conversation.actions.markRead(input)),
  setPinned: authedRouter.conversation.setPinned.handler(async ({ context, input }) => context.conversation.actions.setPinned(input)),
  watchList: authedRouter.conversation.watchList.handler(async ({ context, signal }) => context.conversation.watchList({
    deviceId: context.device.id,
    authorization: context.reqHeaders?.get('authorization'),
    signal,
  })),
  list: authedRouter.conversation.list.handler(async ({ context }) => context.conversation.queries.list()),
  history: authedRouter.conversation.history.handler(async ({ context, input }) => context.conversation.queries.history(input)),
  submit: authedRouter.conversation.submit.handler(async ({ context, input }) => context.conversation.actions.submit(input)),
  updateSubmission: authedRouter.conversation.updateSubmission.handler(async ({ context, input }) => context.conversation.actions.updateSubmission(input)),
  stop: authedRouter.conversation.stop.handler(async ({ context, input }) => context.conversation.actions.stop(input)),
  watch: authedRouter.conversation.watch.handler(async ({ context, input, signal }) => {
    return context.conversation.watch({
      botId: input.botId,
      conversationId: input.conversationId,
      deviceId: context.device.id,
      authorization: context.reqHeaders?.get('authorization'),
      signal,
    });
  }),
});
