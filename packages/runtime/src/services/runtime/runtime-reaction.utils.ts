import { AssistantEntry, UserEntry } from '@earendil-works/pi-durable';
import { ATTACHMENT, REPLY } from '@openbots/contracts/universal';
import { match, P } from 'ts-pattern';
import type { ConversationId, EntryRecord } from '@earendil-works/pi-durable';

export function runtimeReactionTarget(entry: EntryRecord | undefined, conversationId: ConversationId) {
  return match(entry)
    .with({
      conversationId,
      kind: P.union(UserEntry.kind, ATTACHMENT.entryKind, REPLY.entryKind, 'openbots.bot-message', 'openbots.bot-reply'),
    }, (value) => value)
    .with({ conversationId, kind: AssistantEntry.kind }, (value) => match(value.model?.[0])
      .with({ role: 'assistant' }, (message) => (
        message.content.some((part) => part.type === 'text' && part.text.trim() !== '') ? value : undefined
      ))
      .otherwise(() => undefined))
    .otherwise(() => undefined);
}
