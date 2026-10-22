import { AssistantEntry, UserEntry } from '@earendil-works/pi-durable';
import { ATTACHMENT, attachmentMessage, REPLY, replyMessage } from '@repo/contracts/universal';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from '../collaboration/collaboration.constants';
import type { Cursor, EntryRecord, Page } from '@earendil-works/pi-durable';
import type { ConversationHistoryMessage, ConversationSearchPage } from '@repo/contracts/universal';

export function runtimeHistoryPage(page: Page<EntryRecord, Cursor>, query?: string): ConversationSearchPage {
  const needle = query?.toLowerCase();

  return {
    messages: page.items.flatMap((entry) => match(runtimeHistoryMessage(entry))
      .with(P.nullish, () => [])
      .with(P.nonNullable, (message) => match(needle)
        .with(P.string, (value) => message.text.toLowerCase().includes(value) ? [message] : [])
        .otherwise(() => [message]))
      .exhaustive()).reverse(),
    hasMore: page.next !== undefined,
    ...match(page.next)
      .with(P.nonNullable, (cursor) => ({ cursor }))
      .otherwise(() => ({})),
  };
}

function runtimeHistoryMessage(entry: EntryRecord): ConversationHistoryMessage | undefined {
  return match(entry)
    .with({ kind: P.union(UserEntry.kind, AssistantEntry.kind, COLLABORATION.message, COLLABORATION.reply) }, (value) => (
      match(value.model?.[0])
        .with({ role: P.union('user', 'assistant') }, (message) => {
          const text = match(message.content)
            .with(P.string, (content) => content)
            .otherwise((parts) => parts.flatMap((part) => match(part)
              .with({ type: 'text' }, ({ text: content }) => [content])
              .otherwise(() => [])).join('\n'))
            .trim();

          return match(text)
            .with('', () => undefined)
            .otherwise((content) => runtimeHistoryVisible(value, message.role, content, message.timestamp));
        })
        .otherwise(() => undefined)
    ))
    .with({ kind: REPLY.entryKind }, (value) => match(replyMessage.safeParse(value.data))
      .with({ success: true, data: { content: P.string.minLength(1) } }, ({ data }) => (
        runtimeHistoryVisible(value, 'user', data.content, value.model?.[0]?.timestamp ?? 0)
      ))
      .otherwise(() => undefined))
    .with({ kind: ATTACHMENT.entryKind }, (value) => match(attachmentMessage.safeParse(value.data))
      .with({ success: true, data: P.nonNullable }, ({ data }) => {
        const text = (data.content.trim() || data.attachments[0]?.name || '').trim();

        return match(text)
          .with('', () => undefined)
          .otherwise((content) => runtimeHistoryVisible(value, 'user', content, value.model?.[0]?.timestamp ?? 0));
      })
      .otherwise(() => undefined))
    .otherwise(() => undefined);
}

export function runtimeHistoryOutput(page: ConversationSearchPage) {
  return { output: [{ type: 'text' as const, text: JSON.stringify(page) }] };
}

function runtimeHistoryVisible(
  entry: EntryRecord,
  role: 'user' | 'assistant',
  text: string,
  createdAt: number,
): ConversationHistoryMessage {
  return {
    entryId: entry.id,
    role: match(entry)
      .with({ kind: P.union(COLLABORATION.message, COLLABORATION.reply) }, () => 'assistant' as const)
      .otherwise(() => role),
    text,
    createdAt,
    ...match(entry)
      .with({ kind: P.union(COLLABORATION.message, COLLABORATION.reply), data: { fromBotId: P.string } }, ({ data }) => ({
        botId: data.fromBotId,
      }))
      .otherwise(() => ({})),
  };
}
