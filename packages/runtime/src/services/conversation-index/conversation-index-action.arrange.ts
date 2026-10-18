import { match, P } from 'ts-pattern';
import { conversationIndex } from './conversation-index.constants';
import { conversationIndexFind } from './conversation-index.utils';
import type { ConversationIndexArrangeParams, ConversationIndexServiceDeps } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export function conversationIndexActionArrange(
  { harness }: ConversationIndexServiceDeps,
  { botIds }: ConversationIndexArrangeParams,
  context: Context,
) {
  return harness.commit(async (tx) => {
    const index = await tx.doc(conversationIndex);

    for (const conversation of Object.values(index.conversations)) {
      match(conversation)
        .with(P.nonNullable, (item) => {
          item.rank = null;
        })
        .otherwise(() => undefined);
    }

    botIds.forEach((botId, rank) => {
      conversationIndexFind(index, botId).rank = rank;
    });
  }, context);
}
