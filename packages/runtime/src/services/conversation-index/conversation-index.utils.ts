import { AssistantEntry, UserEntry } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { ConversationIndexDocument, ConversationIndexItem, ConversationIndexPreview } from '../../types/conversation-index.types';
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
  lastMessage: ConversationSummary['lastMessage'] = null,
): Promise<ConversationIndexPreview> {
  const page = await conversation.entries({}, 100, cursor, context);
  const messages = page.items.map(conversationIndexMessage);
  const latest = lastMessage ?? messages.find((message) => message !== null) ?? null;
  const assistant = messages.find((message) => message?.role === 'assistant');

  return match({ assistant, cursor: page.next })
    .with({ assistant: P.nonNullable }, ({ assistant: message }) => ({ lastMessage: latest, lastAssistantEntryId: message.entryId }))
    .with({ cursor: P.nonNullable }, ({ cursor: next }) => conversationIndexLatest(conversation, context, next, latest))
    .otherwise(() => ({ lastMessage: latest, lastAssistantEntryId: 0 }));
}

export function conversationIndexSummaries(index: Readonly<ConversationIndexDocument> | null | undefined, graph: PiDurableTypes.TaskGraph) {
  const running = new Set<number>(Object.values(graph.tasks)
    .filter((task) => !task.abortRequested && !task.background)
    .map((task) => task.conversationId));

  return Object.values(index?.conversations ?? {}).flatMap((conversation) => match(conversation)
    .with(P.nonNullable, ({ lastAssistantEntryId, ...summary }) => [{
      ...summary,
      hasUnread: lastAssistantEntryId > summary.readThroughEntryId,
      isRunning: running.has(summary.conversationId),
    }])
    .otherwise(() => []));
}

export function conversationIndexFind(index: ConversationIndexDocument, botId: string) {
  return match(Object.values(index.conversations).find((conversation) => conversation?.botId === botId))
    .with(P.nonNullable, (conversation) => conversation)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'conversation', resourceId: botId });
    });
}

export function conversationIndexPreferences(conversation: ConversationIndexItem) {
  return {
    isPinned: conversation.isPinned,
    readThroughEntryId: conversation.readThroughEntryId,
    hasUnread: conversation.lastAssistantEntryId > conversation.readThroughEntryId,
  };
}
