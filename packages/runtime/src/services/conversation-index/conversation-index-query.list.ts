import { conversationIndex } from './conversation-index.constants';
import { conversationIndexSummaries } from './conversation-index.utils';
import type { ConversationIndexServiceDeps } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export async function conversationIndexQueryList({ harness }: ConversationIndexServiceDeps, context: Context) {
  const index = await harness.snapshot(conversationIndex, context);
  const graph = await harness.taskGraph(context);

  try {
    return conversationIndexSummaries(index, graph.value);
  } finally {
    graph.dispose();
  }
}
