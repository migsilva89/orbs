import { replicatedState } from '@earendil-works/chord';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { conversationIndex } from './conversation-index.constants';
import { conversationIndexSummaries } from './conversation-index.utils';
import type { ConversationIndexServiceDeps } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export async function conversationIndexQueryWatch({ harness }: ConversationIndexServiceDeps, context: Context) {
  const index = match(await harness.watchDoc(conversationIndex, context))
    .with(P.nonNullable, (watch) => watch)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Conversation index is missing.' });
    });

  try {
    const graph = await harness.watchTaskGraph(context);
    let summaries = index.value;
    let tasks = graph.value;
    const state = replicatedState({ conversations: conversationIndexSummaries(summaries, tasks) });

    index.start(async (value, _ops, commitContext) => {
      summaries = value;
      state.change(commitContext, (draft) => {
        draft.conversations = conversationIndexSummaries(summaries, tasks);
      });
    });
    graph.start(async (value, _ops, commitContext) => {
      tasks = value;
      state.change(commitContext, (draft) => {
        draft.conversations = conversationIndexSummaries(summaries, tasks);
      });
    });

    const conversationIndexStop = async () => {
      const [end] = await Promise.all([
        index.stop(),
        graph.stop(),
      ]);

      return end;
    };

    const closed = Promise.race([index.closed, graph.closed]).then(async (end) => {
      await conversationIndexStop();
      return end;
    });

    return { state, closed, stop: conversationIndexStop };
  } catch (error) {
    await index.stop();
    throw error;
  }
}
