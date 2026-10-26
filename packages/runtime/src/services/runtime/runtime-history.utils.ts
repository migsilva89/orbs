import { AssistantEntry, StorageRequestError, UserEntry } from '@earendil-works/pi-durable';
import { ATTACHMENT, attachmentMessage, ENTRY, REPLY, replyMessage } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from '../collaboration/collaboration.constants';
import type { Context } from '@earendil-works/chord/context';
import type * as PiDurableTypes from '@earendil-works/pi-durable';
import type { ConversationHistoryMessage, ConversationSearchPage } from '@repo/contracts/universal';

export function runtimeHistoryPage(page: PiDurableTypes.Page<PiDurableTypes.EntryRecord, PiDurableTypes.Cursor>, query?: string): ConversationSearchPage {
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

function runtimeHistoryMessage(entry: PiDurableTypes.EntryRecord): ConversationHistoryMessage | undefined {
  return match(entry)
    .with({ kind: P.union(UserEntry.kind, AssistantEntry.kind, ENTRY.routineRun, COLLABORATION.message, COLLABORATION.reply) }, (value) => (
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
  entry: PiDurableTypes.EntryRecord,
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

export async function runtimeHistoryEntries(
  api: PiDurableTypes.ToolExecutionApi,
  limit: number | undefined,
  cursor: PiDurableTypes.Cursor | undefined,
  context: Context,
) {
  try {
    return await api.commit((tx) => tx.scanEntries({
      conversationId: api.conversationId,
      order: 'descending',
    }, limit ?? 50, cursor), context);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(StorageRequestError), (cause) => new Errors.VALIDATION_ERROR({ fields: {}, cause }))
      .otherwise((cause) => cause);
  }
}
