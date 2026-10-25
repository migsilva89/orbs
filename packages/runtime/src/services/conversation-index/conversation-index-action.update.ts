import { match, P } from 'ts-pattern';
import { conversationIndex } from './conversation-index.constants';
import type { ConversationIndexServiceDeps, ConversationIndexUpdateParams } from '../../types/conversation-index.types';

export function conversationIndexActionUpdate(
  { harness }: ConversationIndexServiceDeps,
  { messages, context }: ConversationIndexUpdateParams,
) {
  return harness.commit(async (tx) => {
    const index = await tx.doc(conversationIndex);

    for (const { conversationId, lastMessage } of messages) {
      match(index.conversations[conversationId])
        .with(P.nonNullable, (current) => {
          match(lastMessage.role)
            .with('assistant', () => {
              current.lastAssistantEntryId = Math.max(current.lastAssistantEntryId, lastMessage.entryId);
            })
            .with('user', () => undefined)
            .exhaustive();

          match(lastMessage.entryId > (current.lastMessage?.entryId ?? 0))
            .with(true, () => {
              current.lastMessage = lastMessage;
            })
            .with(false, () => undefined)
            .exhaustive();
        })
        .otherwise(() => undefined);
    }
  }, context);
}
