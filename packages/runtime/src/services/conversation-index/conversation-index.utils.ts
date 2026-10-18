import { AssistantEntry, UserEntry } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';
import type * as PiDurableTypes from '@earendil-works/pi-durable';
import type { ConversationSummary } from '@openbots/contracts/universal';

export function conversationIndexMessage(entry: PiDurableTypes.EntryRecord): ConversationSummary['lastMessage'] {
  return match(entry.kind)
    .with(P.union(UserEntry.kind, AssistantEntry.kind), () => {
      return match(entry.model?.[0])
        .with({ role: P.union('user', 'assistant') }, (value) => {
          const content = match(value.content)
            .with(P.string, (text) => text)
            .otherwise((parts) => parts.flatMap((part) => match(part)
              .with({ type: 'text' }, ({ text }) => [text])
              .otherwise(() => [])).join(' '));

          const preview = content.replace(/\s+/g, ' ').trim().slice(0, 160);

          return match(preview)
            .with('', () => null)
            .otherwise(() => ({ entryId: entry.id, role: value.role, preview, createdAt: value.timestamp }));
        })
        .otherwise(() => null);
    })
    .otherwise(() => null);
}

export async function conversationIndexLatest(
  conversation: PiDurableTypes.Conversation,
  context: Context,
  cursor?: PiDurableTypes.Cursor,
): Promise<ConversationSummary['lastMessage']> {
  const page = await conversation.entries({}, 100, cursor, context);
  const latest = page.items.map(conversationIndexMessage).find((message) => message !== null);

  return match({ latest, cursor: page.next })
    .with({ latest: P.nonNullable }, ({ latest: message }) => message)
    .with({ cursor: P.nonNullable }, ({ cursor: next }) => conversationIndexLatest(conversation, context, next))
    .otherwise(() => null);
}

export function conversationIndexSummaries(index: Readonly<ConversationIndexDocument> | null | undefined, graph: PiDurableTypes.TaskGraph) {
  const running = new Set<number>(Object.values(graph.tasks)
    .filter((task) => !task.abortRequested && !task.background)
    .map((task) => task.conversationId));

  return Object.values(index?.conversations ?? {}).flatMap((conversation) => match(conversation)
    .with(P.nonNullable, (summary) => [{ ...summary, isRunning: running.has(summary.conversationId) }])
    .otherwise(() => []));
}
