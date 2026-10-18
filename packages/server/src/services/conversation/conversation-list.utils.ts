import { match, P } from 'ts-pattern';
import type { Bot, ConversationSummary } from '@openbots/contracts/universal';

export function conversationListItems(
  botList: Bot[],
  conversations: ConversationSummary[],
) {
  const summaries = new Map(conversations.map((conversation) => [conversation.botId, conversation]));

  return botList.flatMap((bot) => {
    const summary = summaries.get(bot.id);

    return match(summary)
      .with(P.nonNullable, (conversation) => [{ ...conversation, name: bot.name, handle: bot.handle, avatar: bot.avatar }])
      .otherwise(() => []);
  }).sort((left, right) => Number(left.isHidden) - Number(right.isHidden)
    || Number(right.isPinned) - Number(left.isPinned)
    || (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER)
    || (right.lastMessage?.createdAt ?? 0) - (left.lastMessage?.createdAt ?? 0)
    || left.botId.localeCompare(right.botId));
}
