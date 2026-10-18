import { match, P } from 'ts-pattern';
import { conversationIndex } from './conversation-index.constants';
import type { ConversationIndexServiceDeps, ConversationIndexUpdate } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export function conversationIndexActionUpdate(
  { harness }: ConversationIndexServiceDeps,
  messages: ConversationIndexUpdate[],
  context: Context,
) {
  return harness.commit(async (tx) => {
    const index = await tx.doc(conversationIndex);

    for (const { conversationId, lastMessage } of messages) {
      match(index.conversations[conversationId])
        .with(P.nonNullable, (current) => {
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
