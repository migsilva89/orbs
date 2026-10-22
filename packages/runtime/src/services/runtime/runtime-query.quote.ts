import { AssistantEntry, UserEntry } from '@earendil-works/pi-durable';
import { ATTACHMENT, attachmentMessage, REPLY, replyMessage } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationId, EntryId } from '@earendil-works/pi-durable';
import type { MessageQuote } from '@repo/contracts/universal';

export async function runtimeQueryQuote(
  { harness }: RuntimeServiceDeps,
  conversationId: ConversationId,
  entryId: number | null | undefined,
  context: Context,
): Promise<MessageQuote | undefined> {
  return match(entryId)
    .with(P.nullish, () => undefined)
    .otherwise((id) => harness.commit(async (tx) => {
      const entry = match(await tx.entry(id as EntryId))
        .with({ conversationId }, (value) => value)
        .otherwise(() => {
          throw new Errors.NOT_FOUND({ resource: 'message', resourceId: id });
        });

      const quote = match(entry)
        .with({
          conversationId,
          kind: ATTACHMENT.entryKind,
          data: P.nonNullable,
        }, (value) => {
          const message = attachmentMessage.parse(value.data);
          return { role: 'user' as const, content: message.content || message.attachments.map((file) => file.name).join(', ') };
        })
        .with({
          conversationId,
          kind: REPLY.entryKind,
          data: P.nonNullable,
        }, (value) => ({
          role: 'user' as const,
          content: replyMessage.parse(value.data).content,
        }))
        .with({ conversationId, kind: P.union(UserEntry.kind, AssistantEntry.kind, 'bots.bot-message', 'bots.bot-reply') }, (value) => (
          match(value.model?.[0])
            .with({ role: P.union('user', 'assistant') }, (message) => ({
              role: message.role,
              content: match(message.content)
                .with(P.string, (text) => text)
                .otherwise((parts) => parts.flatMap((part) => match(part)
                  .with({ type: 'text' }, ({ text }) => [text])
                  .otherwise(() => [])).join('\n')),
            }))
            .otherwise(() => undefined)
        ))
        .otherwise(() => undefined);

      return match(quote)
        .with({ content: P.string.regex(/\S/) }, (value) => ({
          entryId: id,
          role: value.role,
          content: value.content.slice(0, 4000),
          ...match(entry)
            .with({ kind: P.union('bots.bot-message', 'bots.bot-reply'), data: { fromBotId: P.string } }, ({ data }) => ({
              role: 'assistant' as const,
              botId: data.fromBotId,
            }))
            .otherwise(() => ({})),
        }))
        .otherwise(() => {
          throw new Errors.NOT_FOUND({ resource: 'message', resourceId: id });
        });
    }, context));
}
