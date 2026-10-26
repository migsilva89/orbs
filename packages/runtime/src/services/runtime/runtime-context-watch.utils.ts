import { match, P } from 'ts-pattern';
import { collaborationPrivateLinks } from '../collaboration/collaboration.constants';
import { subagentAgents } from '../subagent/subagent.constants';
import type { CommitChange, ConversationId, TaskGraph } from '@earendil-works/pi-durable';

export function runtimeContextWatchBusyIds(graph: TaskGraph) {
  return [...new Set(Object.values(graph.tasks)
    .filter((task) => !task.abortRequested && !task.background)
    .map((task) => task.conversationId))]
    .sort((left, right) => left - right)
    .join(' ');
}

export function runtimeContextWatchIsRelevant(changes: readonly CommitChange[], sourceConversationId: ConversationId) {
  return changes.some((change) => match(change)
    .with({ type: 'conversation', value: { owner: { conversationId: sourceConversationId } } }, () => true)
    .with({
      type: 'document',
      conversationId: sourceConversationId,
      record: { kind: P.union(subagentAgents.definition.kind, collaborationPrivateLinks.definition.kind) },
    }, () => true)
    .otherwise(() => false));
}
